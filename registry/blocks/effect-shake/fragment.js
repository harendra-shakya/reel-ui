/** Handheld shake on a clip. @param {object} clip */
export function effectShake(clip) {
  return { tracks: [{ ...clip, effect: "shake" }] };
}
