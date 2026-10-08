/** Series title card. @param {string} text @param {string} [sub=""] @param {number} [start=0] @param {number} [end=2] @param {string} [style="opener"] */
export function titleOpener(text, sub = "", start = 0, end = 2, style = "opener") {
  return { titles: [{ start, end, text, sub, style }] };
}
