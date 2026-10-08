/** Hero title overlay. @param {string} text @param {string} [sub=""] @param {number} [start=0] @param {number} [end=2] */
export function titleHero(text, sub = "", start = 0, end = 2) {
  return { titles: [{ start, end, text, sub, style: "hero" }] };
}
