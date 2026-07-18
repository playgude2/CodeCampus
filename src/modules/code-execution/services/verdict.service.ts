import { Injectable } from '@nestjs/common';
import { SubmissionStatus } from '../../submissions/enums/submission-status.enum';
import { RawRun } from '../piston/piston.types';
import { CompareConfig, NormalizerService } from './normalizer.service';

export interface ClassifyContext {
  expected: string;
  compareConfig: CompareConfig;
  memoryLimitBytes: number;
  /** true for compiled languages — enables real compile-stage verdicts. */
  compiled: boolean;
}

/**
 * Pure verdict classifier: maps a Piston run into a verdict. Order of checks
 * mirrors and generalizes the original, but uses Piston's real compile block
 * (language-aware) instead of a Python-centric stderr substring heuristic.
 */
@Injectable()
export class VerdictService {
  constructor(private readonly normalizer: NormalizerService) {}

  classify(raw: RawRun, ctx: ClassifyContext): SubmissionStatus {
    if (raw.transportError) return SubmissionStatus.INTERNAL_ERROR;

    // 1. Compile stage (compiled languages only).
    if (ctx.compiled && raw.compile && raw.compile.code !== 0 && raw.compile.code !== null) {
      return SubmissionStatus.COMPILE_ERROR;
    }

    const run = raw.run;

    // 2. Timeout.
    if (run.status === 'TO') return SubmissionStatus.TIME_LIMIT_EXCEEDED;

    // 3. Memory-limit (honest MLE: killed by signal near the memory ceiling).
    if (
      run.signal === 'SIGKILL' &&
      run.memory > 0 &&
      run.memory >= ctx.memoryLimitBytes * 0.98
    ) {
      return SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
    }

    // 4. Runtime error.
    if (run.status === 'RE' || (run.code !== null && run.code !== 0) || run.stderr.trim().length > 0) {
      // Interpreted-language syntax errors surface here; keep the historical
      // Syntax Error label for that specific signature.
      if (!ctx.compiled && /SyntaxError|IndentationError/.test(run.stderr)) {
        return SubmissionStatus.SYNTAX_ERROR;
      }
      return SubmissionStatus.RUNTIME_ERROR;
    }

    // 5. Compare output.
    const ok = this.normalizer.compare(run.stdout, ctx.expected, ctx.compareConfig);
    return ok ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;
  }
}
