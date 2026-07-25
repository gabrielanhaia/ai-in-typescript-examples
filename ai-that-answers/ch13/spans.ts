export function verifiedSpan(source: string, span: string): string | null {
  const normalise = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  return normalise(source).includes(normalise(span)) ? span : null;
}
