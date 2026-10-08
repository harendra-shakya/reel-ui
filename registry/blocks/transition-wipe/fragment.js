/** Wipe family (wipeleft/right/up/down + smooth variants). @param {number} at @param {number} [dur=0.5] @param {string} [type="wipeleft"] */
export function transitionWipe(at, dur = 0.5, type = "wipeleft") {
  return { transitions: [{ at, dur, type }] };
}
