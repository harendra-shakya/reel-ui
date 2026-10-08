/** Music bed with ducking + fade out. @param {string} music @param {number} [musicDb=-20] @param {boolean} [duck=true] @param {number} [fadeOut=1] */
export function audioDuckNarrate(music, musicDb = -20, duck = true, fadeOut = 1) {
  return { audio: { music, musicDb, duck, fadeOut } };
}
