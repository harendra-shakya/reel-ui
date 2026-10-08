/** Dissolve / pixelize glitch / fadeblack-white. @param {number} at @param {number} [dur=0.5] @param {string} [type="dissolve"] */
export function transitionDissolveGlitch(at, dur = 0.5, type = "dissolve") {
  return { transitions: [{ at, dur, type }] };
}
