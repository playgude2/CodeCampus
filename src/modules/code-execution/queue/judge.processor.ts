import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_JUDGE } from '../../../queue/queue.constants';
import { JudgeService } from '../services/judge.service';

interface JudgeJobData {
  submissionId: string;
}

@Processor(QUEUE_JUDGE, { concurrency: 8 })
export class JudgeProcessor extends WorkerHost {
  private readonly logger = new Logger(JudgeProcessor.name);

  constructor(private readonly judge: JudgeService) {
    super();
  }

  async process(job: Job<JudgeJobData>): Promise<void> {
    this.logger.log(`Judging submission ${job.data.submissionId} (job ${job.id})`);
    await this.judge.judge(job.data.submissionId);
  }
}
