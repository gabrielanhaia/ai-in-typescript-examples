import { SYSTEM_PROMPT_EN } from "./system.en.js";
import { SYSTEM_PROMPT_DE } from "./system.de.js";

const PROMPTS = {
  en: SYSTEM_PROMPT_EN,
  de: SYSTEM_PROMPT_DE,
} as const;

export type PromptKey = keyof typeof PROMPTS;

export function systemPromptFor(key: PromptKey): string {
  return PROMPTS[key];
}
