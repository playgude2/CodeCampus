import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { Submission } from './entities/submission.entity';
import { TestCaseResult } from './entities/test-case-result.entity';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
    @InjectRepository(TestCaseResult) private readonly results: Repository<TestCaseResult>,
  ) {}

  async getById(id: string, actor: AuthenticatedUser): Promise<Submission> {
    const submission = await this.submissions.findOne({ where: { id } });
    if (!submission) throw new NotFoundException('Submission not found');
    this.assertCanView(actor, submission);
    return submission;
  }

  async getResults(submissionId: string): Promise<TestCaseResult[]> {
    return this.results.find({
      where: { submissionId },
      order: { ordinal: 'ASC' },
    });
  }

  async listForProblem(
    assignmentProblemId: string,
    userId: string,
    actor: AuthenticatedUser,
  ): Promise<Submission[]> {
    // Students may only list their own submissions.
    if (actor.role === Role.STUDENT && userId !== actor.id) {
      throw new ForbiddenException('You can only view your own submissions');
    }
    return this.submissions.find({
      where: { assignmentProblemId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  private assertCanView(actor: AuthenticatedUser, submission: Submission): void {
    if (actor.role === Role.ADMIN || actor.role === Role.PROFESSOR) return;
    if (submission.userId === actor.id) return;
    throw new ForbiddenException('You cannot view this submission');
  }
}
