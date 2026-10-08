/** Neon caption lines. @param {string[]} lines @param {number} [startAt=0] @param {number} [perLine=2] @param {string} [style="neon"] */
export function captionNeon(lines, startAt = 0, perLine = 2, style = "neon") {
  return { captions: lines.map((text, i) => ({ start: startAt + i * (perLine + 0.2), end: startAt + i * (perLine + 0.2) + perLine, text, style })) };
}
