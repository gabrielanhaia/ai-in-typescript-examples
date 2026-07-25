// ch14/config.ts

/** Facts about the answering model. Book 1 ch. 14 handed it over. */
export const ANSWERING_MODEL = "claude-sonnet-5";
export const ANSWER_TOKENS = 1_024;
/** Empty, and not by omission: Sonnet 5 rejects a non-default value. */
export const SAMPLING: Record<string, number> = {};

/** The embedding model. Both are part of a vector's identity (ch. 6). */
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

/** Decisions chapter 4 tells you how to make on your own corpus. */
export const CHUNK_SIZE = 900;
export const CHUNK_OVERLAP = 135;

/** How many chunks reach the prompt, and how much window they fill. */
export const CONTEXT_K = 5;
export const CONTEXT_BUDGET_TOKENS = 6_000;

/** Where the corpus and its index live. */
export const CORPUS_ROOT = "corpus";
export const CHUNKS_TABLE = "chunks";
