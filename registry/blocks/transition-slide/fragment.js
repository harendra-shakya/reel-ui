/** Slide-left transition at a cut point. @param {number} at @param {number} [dur=0.5] */
export function transitionSlide(at, dur = 0.5) {
  return { transitions: [{ at, dur, type: "slide" }] };
}
