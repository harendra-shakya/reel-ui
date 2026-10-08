/** Blur-cross (hblur) + fadegrays for soft edits. @param {number} at @param {number} [dur=0.5] @param {string} [type="hblur"] */
export function transitionBlur(at, dur = 0.5, type = "hblur") {
  return { transitions: [{ at, dur, type }] };
}
