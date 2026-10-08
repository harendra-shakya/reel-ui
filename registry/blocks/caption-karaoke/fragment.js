/** Karaoke captions (line-level: box swaps per line; per-word timing is a drawtext limit). @param {string[]} lines @param {number} [startAt=0] @param {number} [perLine=1.5] */
export function captionKaraoke(lines, startAt = 0, perLine = 1.5) {
  return {
    captions: lines.map((text, i) => ({
      start: startAt + i * perLine,
      end: startAt + (i + 1) * perLine,
      text,
      style: "karaoke",
    })),
  };
}
