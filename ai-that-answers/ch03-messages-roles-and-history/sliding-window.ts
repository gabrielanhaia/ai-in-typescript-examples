import type { BaseMessage } from "langchain";

export function slidingWindow(
  history: BaseMessage[],
  turns: number,
): BaseMessage[] {
  const [system, ...rest] = history;
  return [system, ...rest.slice(-turns * 2)];
}
