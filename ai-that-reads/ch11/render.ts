// ch11/render.ts
import { locationOf, type Citable } from "./identity.js";

export interface Citation {
  marker: number;
  chunkId: string;
  label: string;
}

const MARKER = /\[(\d+)\]/g;

export interface RenderedAnswer {
  text: string;
  cited: Citation[];
  unknownMarkers: number[];
}

export function renderAnswer(
  text: string,
  supplied: Citable[],
): RenderedAnswer {
  const byMarker = new Map<number, Citable>(
    supplied.map((meta, index) => [index + 1, meta]),
  );

  const used = new Set<number>();
  const unknownMarkers: number[] = [];

  for (const match of text.matchAll(MARKER)) {
    const marker = Number(match[1]);
    if (byMarker.has(marker)) used.add(marker);
    else unknownMarkers.push(marker);
  }

  const cited = [...used]
    .sort((a, b) => a - b)
    .flatMap((marker) => {
      const meta = byMarker.get(marker);
      if (meta === undefined) return [];
      const where = locationOf(meta);
      return [
        {
          marker,
          chunkId: meta.chunkId,
          label: where === "" ? meta.title : `${meta.title}, ${where}`,
        },
      ];
    });

  return { text, cited, unknownMarkers };
}
