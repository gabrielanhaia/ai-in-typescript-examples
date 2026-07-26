// PRINTED IN CHAPTER 13 as `ch13/covering-note.ts`.
//
// A single request, with no iteration around it. Numbers go in; wording
// comes out. If the reply is cut short the caller gets the raw figures
// instead, which is the least exciting way for this to go wrong.
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function coveringNote(report: string): Promise<string> {
  const reply = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2_048,
    system:
      "Write two sentences for the workshop manager from the figures " +
      "below, naming whichever one needs attention. Use no number " +
      "that is not in them.",
    messages: [{ role: "user", content: report }],
  });

  if (reply.stop_reason !== "end_turn") return report;

  return reply.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
