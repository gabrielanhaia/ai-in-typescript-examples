// The block printed at the top of chapter 7 — the `tool_result` block's own
// shape. It is a file so the compiler checks the claim: every field the
// chapter prints is a field the SDK's param type has, and the content union
// is the *param* one rather than the response-side `ContentBlock`.
//
// Nothing imports this and nothing runs it.
import type {
  CacheControlEphemeral,
  DocumentBlockParam,
  ImageBlockParam,
  TextBlockParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";

interface Printed {
  tool_use_id: string;
  type: "tool_result";
  content?:
    | string
    | Array<TextBlockParam | ImageBlockParam | DocumentBlockParam>;
  is_error?: boolean;
  cache_control?: CacheControlEphemeral | null;
}

export const printedShapeIsTheRealOne: ToolResultBlockParam = {} as Printed;
