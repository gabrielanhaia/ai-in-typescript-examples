// ch04/fixed.ts
export function splitFixed(
  text: string,
  size: number,
  overlap: number,
): string[] {
  if (overlap >= size) {
    throw new Error(`overlap ${overlap} is not less than size ${size}`);
  }
  const chunks: string[] = [];
  const stride = size - overlap;
  for (let start = 0; start < text.length; start += stride) {
    chunks.push(text.slice(start, start + size));
  }
  return chunks;
}
