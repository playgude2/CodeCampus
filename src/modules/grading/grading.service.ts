import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SUBMISSION_FINALIZED, SubmissionFinalizedEvent } from '../../common/events/submission-events';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AssignmentProblem } from '../assignments/entities/assignment-problem.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { ClassroomsService } from '../classrooms/classrooms.service';
import { Classroom } from '../classrooms/entities/classroom.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { SubmissionStatus } from '../submissions/enums/submission-status.enum';
import { AssignmentScore } from './entities/assignment-score.entity';
import { ProblemScore } from './entities/problem-score.entity';
import { UpdateScoreDto } from './dto/grading.dto';

@Injectable()
export class GradingService {
  private readonly logger = new Logger(GradingService.name);

  constructor(
    @InjectRepository(ProblemScore) private readonly problemScores: Repository<ProblemScore>,
    @InjectRepository(AssignmentScore) private readonly assignmentScores: Repository<AssignmentScore>,
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
    @InjectRepository(AssignmentProblem) private readonly assignmentProblems: Repository<AssignmentProblem>,
    @InjectRepository(Assignment) private readonly assignments: Repository<Assignment>,
    private readonly classrooms: ClassroomsService,
  ) {}

  /**
   * Award-on-accept: when a submission finalizes, update the student's problem
   * score (full points on first Accept) and roll up the assignment total.
   */
  @OnEvent(SUBMISSION_FINALIZED)
  async onSubmissionFinalized(event: SubmissionFinalizedEvent): Promise<void> {
    try {
      const submission = await this.submissions.findOne({ where: { id: event.submissionId } });
      if (!submission) return;
      const ap = await this.assignmentProblems.findOne({
        where: { id: submission.assignmentProblemId },
        relations: { assignment: true },
      });
      if (!ap) return;

      const classroom = await this.classrooms.getById(ap.assignment.classroomId);
      // Professor test-submissions never affect scores.
      if (classroom.professorId === submission.userId) return;

      const ps = await this.getOrCreateProblemScore(ap.id, submission.userId);
      ps.submissionCount += 1;

      const accepted = submission.status === SubmissionStatus.ACCEPTED;
      const alreadyAccepted = ps.submission?.status === SubmissionStatus.ACCEPTED;
      if (accepted) {
        ps.submission = submission;
        ps.submissionId = submission.id;
        ps.score = ap.score; // award full points
      } else if (!alreadyAccepted) {
        ps.submission = submission;
        ps.submissionId = submission.id;
        // score unchanged (stays 0 until an accepted submission arrives)
      }
      await this.problemScores.save(ps);
      await this.recomputeAssignmentScore(ap.assignmentId, submission.userId);
    } catch (err) {
      this.logger.error(`Scoring failed for submission ${event.submissionId}: ${String(err)}`);
    }
  }

  async getStudentScore(assignmentId: string, actor: AuthenticatedUser) {
    return this.buildStudentScore(assignmentId, actor.id);
  }

  async getStudentsScore(assignmentId: string, actor: AuthenticatedUser) {
    const classroom = await this.classroomForAssignment(assignmentId);
    this.assertStaffOrGrader(actor, classroom);
    const students = classroom.students ?? [];
    return Promise.all(students.map((s) => this.buildStudentScore(assignmentId, s.id)));
  }

  async updateScore(
    apId: string,
    studentId: string,
    dto: UpdateScoreDto,
    actor: AuthenticatedUser,
  ): Promise<ProblemScore> {
    const ap = await this.assignmentProblems.findOne({
      where: { id: apId },
      relations: { assignment: true },
    });
    if (!ap) throw new NotFoundException('Assignment problem not found');
    const classroom = await this.classrooms.getById(ap.assignment.classroomId);
    this.assertStaffOrGrader(actor, classroom);

    const ps = await this.getOrCreateProblemScore(apId, studentId);
    ps.score = dto.score;
    if (dto.feedback !== undefined) ps.feedback = dto.feedback;
    ps.createdById = actor.id;
    await this.problemScores.save(ps);
    await this.recomputeAssignmentScore(ap.assignmentId, studentId);
    return ps;
  }

  async getAssignmentScore(assignmentId: string, actor: AuthenticatedUser): Promise<AssignmentScore> {
    return this.getOrCreateAssignmentScore(assignmentId, actor.id);
  }

  // ---- helpers ----

  private async buildStudentScore(assignmentId: string, userId: string) {
    const aps = await this.assignmentProblems.find({
      where: { assignmentId },
      relations: { problem: true },
    });
    const scores = await this.problemScores
      .createQueryBuilder('ps')
      .where('ps.user_id = :userId', { userId })
      .andWhere('ps.assignment_problem_id IN (:...ids)', {
        ids: aps.length ? aps.map((a) => a.id) : ['00000000-0000-0000-0000-000000000000'],
      })
      .getMany();
    const byAp = new Map(scores.map((s) => [s.assignmentProblemId, s]));

    const problems = aps.map((ap) => {
      const s = byAp.get(ap.id);
      return {
        assignmentProblemId: ap.id,
        problemId: ap.problemId,
        title: ap.problem?.title ?? '',
        maxScore: ap.score,
        score: s?.score ?? 0,
        submissionCount: s?.submissionCount ?? 0,
        solved: (s?.submissionId ?? null) !== null && (s?.score ?? 0) > 0,
        feedback: s?.feedback ?? '',
      };
    });

    const assignmentScore = await this.getOrCreateAssignmentScore(assignmentId, userId);
    const maxScore = aps.reduce((sum, ap) => sum + ap.score, 0);
    return {
      userId,
      assignmentScore: {
        finalScore: assignmentScore.finalScore,
        maxScore,
        feedback: assignmentScore.feedback,
      },
      problems,
    };
  }

  private async getOrCreateProblemScore(apId: string, userId: string): Promise<ProblemScore> {
    let ps = await this.problemScores.findOne({
      where: { assignmentProblemId: apId, userId },
      relations: { submission: true },
    });
    if (!ps) {
      ps = this.problemScores.create({ assignmentProblemId: apId, userId, score: 0, submissionCount: 0 });
      ps = await this.problemScores.save(ps);
    }
    return ps;
  }

  private async getOrCreateAssignmentScore(assignmentId: string, userId: string): Promise<AssignmentScore> {
    let as = await this.assignmentScores.findOne({ where: { assignmentId, userId } });
    if (!as) {
      as = this.assignmentScores.create({ assignmentId, userId, finalScore: 0 });
      as = await this.assignmentScores.save(as);
    }
    return as;
  }

  private async recomputeAssignmentScore(assignmentId: string, userId: string): Promise<void> {
    const row = await this.problemScores
      .createQueryBuilder('ps')
      .innerJoin(AssignmentProblem, 'ap', 'ap.id = ps.assignment_problem_id')
      .where('ap.assignment_id = :assignmentId', { assignmentId })
      .andWhere('ps.user_id = :userId', { userId })
      .select('COALESCE(SUM(ps.score), 0)', 'total')
      .getRawOne<{ total: string }>();
    const total = Number(row?.total ?? 0);
    const as = await this.getOrCreateAssignmentScore(assignmentId, userId);
    as.finalScore = total;
    await this.assignmentScores.save(as);
  }

  private async classroomForAssignment(assignmentId: string): Promise<Classroom> {
    const assignment = await this.assignments.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return this.classrooms.getDetail(assignment.classroomId);
  }

  private assertStaffOrGrader(actor: AuthenticatedUser, classroom: Classroom): void {
    if (actor.role === Role.ADMIN) return;
    if (classroom.createdById === actor.id || classroom.professorId === actor.id) return;
    if (classroom.graders?.some((g) => g.id === actor.id)) return;
    throw new ForbiddenException('You do not have grading access to this classroom');
  }
}
