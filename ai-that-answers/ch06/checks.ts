export interface Check {
  name: string;
  passes: (output: string, input: string) => boolean;
}

const LABELS = ["drivetrain", "brakes", "wheels", "frame", "other"];

export const checks: readonly Check[] = [
  {
    name: "single line",
    passes: (out) => !out.includes("\n"),
  },
  {
    name: "known label",
    passes: (out) => LABELS.includes(out.split(":")[0]?.trim() ?? ""),
  },
  {
    name: "no preamble",
    passes: (out) => !/^(here|sure|certainly|based on)/i.test(out),
  },
  {
    name: "under 40 words",
    passes: (out) => out.trim().split(/\s+/).length <= 40,
  },
  {
    name: "no price quoted",
    passes: (out) => !/[£$€]\s?\d/.test(out),
  },
];
