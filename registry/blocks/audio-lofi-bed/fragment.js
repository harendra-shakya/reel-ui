/** Ambient non-ducking bed. @param {string} music @param {number} [musicDb=-26] @param {number} [fadeOut=2] */
export function audioLofiBed(music, musicDb = -26, fadeOut = 2) {
  return { audio: { music, musicDb, duck: false, fadeOut } };
}
