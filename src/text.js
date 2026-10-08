/** drawtext escaping + caption line wrapping. Zero deps. */

/** Escape text for ffmpeg drawtext (single-quoted value). */
export function escDrawText(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%")
    .replace(/\n/g, " ");
}

/** Greedy word-wrap to maxChars per line. */
export function wrapWords(text, maxChars = 22) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2); // ponytail: max 2 lines, add marquee scroll if longer captions matter
}
