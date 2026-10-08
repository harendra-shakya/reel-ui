/** drawtext escaping + caption line wrapping. Zero deps. */

/** Escape text for ffmpeg drawtext (single-quoted value). */
export function escDrawText(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%");
}

/** Greedy word-wrap to maxChars per line. Returns ALL lines (renderer stacks them). */
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
  return lines.length ? lines : [""];
}
