// ch06/state.ts
import {
  MessagesValue,
  ReducedValue,
  StateSchema,
} from "@langchain/langgraph";
import { z } from "zod";
import { TOOLS } from "./shop.js";

export const JobState = new StateSchema({
  messages: MessagesValue,
  steps: z.array(z.enum(TOOLS)).default(() => []),
  done: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.string(),
    reducer: (current, next) => [...current, next],
  }),
});
