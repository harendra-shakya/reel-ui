/** Zoom crossfade at a cut point. @param {number} at @param {number} [dur=0.6] */
export function transitionXfadeZoom(at, dur = 0.6) {
  return { transitions: [{ at, dur, type: "zoom" }] };
}
