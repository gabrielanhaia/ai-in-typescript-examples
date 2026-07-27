// ch03/older-forms.ts
import type { BaseMessage } from "@langchain/core/messages";
import {
  Annotation,
  messagesStateReducer,
} from "@langchain/langgraph";
import { registry } from "@langchain/langgraph/zod";
import { z } from "zod";

// The form most existing code and most tutorials use.
export const AnnotationState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  cursor: Annotation<number>,
});

// A plain Zod object, with reducers attached through the zod-4
// meta registry rather than through the deprecated plugin.
export const ZodState = z.object({
  completed: z.array(z.string()).register(registry, {
    default: () => [],
    reducer: {
      schema: z.string(),
      fn: (current: string[], next: string) => [...current, next],
    },
  }),
  cursor: z.number().default(0),
});
