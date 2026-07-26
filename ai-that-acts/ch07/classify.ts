// PRINTED IN CHAPTER 7 as `ch07/classify.ts` — `RETRYABLE` and `kindOf`.
//
// `HttpFailure` is not printed. The chapter names it and states the property
// that matters: `message` is for your logs, `forTheModel` is the only field
// that ever reaches a `tool_result`.
export type FailureKind = "transient" | "permanent" | "model-caused";

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

export function kindOf(status: number): FailureKind {
  if (RETRYABLE.has(status)) return "transient";
  if (status === 400 || status === 404 || status === 422) {
    return "model-caused";
  }
  return "permanent";
}

export class HttpFailure extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly forTheModel: string,
  ) {
    super(message);
    this.name = "HttpFailure";
  }

  get kind(): FailureKind {
    return kindOf(this.status);
  }
}
