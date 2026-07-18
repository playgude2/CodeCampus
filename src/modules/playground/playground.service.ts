import { Injectable } from '@nestjs/common';
import { Language } from '../../common/enums/language.enum';
import { ExecutorService } from '../code-execution/executors/executor.service';
import { SubmissionStatus } from '../submissions/enums/submission-status.enum';

export interface PlaygroundResult {
  status: SubmissionStatus;
  stdout: string;
  error: string;
  runtimeMs: number;
}

/**
 * Public, stateless code runner (like a TS/Namaste playground). Runs RAW user
 * code (no driver merge, no expected-output comparison) through the shared
 * Piston pool. No persistence.
 */
@Injectable()
export class PlaygroundService {
  constructor(private readonly executor: ExecutorService) {}

  async run(language: Language, userCode: string, stdin: string): Promise<PlaygroundResult> {
    const rt = this.executor.getRuntime(language);
    const opts = this.executor.defaultOptions();
    const raw = await this.executor.execute(language, userCode, stdin, opts);

    const status = this.classify(raw.transportError, raw.run, rt.compiled, raw.compile?.code ?? null);
    return {
      status,
      stdout: raw.run.stdout,
      error: status === SubmissionStatus.FINISHED ? '' : raw.run.stderr || (raw.transportError ?? ''),
      runtimeMs: Math.round(raw.wallTimeMs),
    };
  }

  private classify(
    transportError: string | undefined,
    run: { status: string | null; stderr: string; code: number | null },
    compiled: boolean,
    compileCode: number | null,
  ): SubmissionStatus {
    if (transportError) return SubmissionStatus.INTERNAL_ERROR;
    if (compiled && compileCode !== null && compileCode !== 0) return SubmissionStatus.COMPILE_ERROR;
    if (run.status === 'TO') return SubmissionStatus.TIME_LIMIT_EXCEEDED;
    if (run.status === 'RE' || (run.code !== null && run.code !== 0) || run.stderr.trim().length > 0) {
      if (!compiled && /SyntaxError|IndentationError/.test(run.stderr)) {
        return SubmissionStatus.SYNTAX_ERROR;
      }
      return SubmissionStatus.RUNTIME_ERROR;
    }
    return SubmissionStatus.FINISHED;
  }
}
