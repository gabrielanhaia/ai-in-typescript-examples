import { initChatModel } from "langchain";
import { ANSWER_TOKENS, INTERACTIVE, MODEL, SAMPLING } from "./config.js";

export type ChatModel = Awaited<ReturnType<typeof initChatModel>>;

let cached: ChatModel | undefined;

export async function chatModel(): Promise<ChatModel> {
  cached ??= await initChatModel(MODEL.model, {
    modelProvider: MODEL.provider,
    maxTokens: ANSWER_TOKENS,
    ...SAMPLING,
    maxRetries: INTERACTIVE.maxRetries,
    maxConcurrency: INTERACTIVE.maxConcurrency,
    clientOptions: { timeout: INTERACTIVE.timeoutMs },
  });
  return cached;
}
