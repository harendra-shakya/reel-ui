/** Chapter or quote card. @param {string} text @param {string} [sub=""] @param {number} [start=0] @param {number} [end=3] @param {string} [style="chapter"] */
export function titleChapterCard(text, sub = "", start = 0, end = 3, style = "chapter") {
  return { titles: [{ start, end, text, sub, style }] };
}
