/** Lower-third name card. @param {string} text @param {string} [sub=""] @param {number} [start=0.5] @param {number} [end=4] */
export function titleLowerThird(text, sub = "", start = 0.5, end = 4) {
  return { titles: [{ start, end, text, sub, style: "lower-third" }] };
}
