/** Push-and-cover / reveal news-style cuts. @param {number} at @param {number} [dur=0.5] @param {string} [type="coverleft"] */
export function transitionCoverReveal(at, dur = 0.5, type = "coverleft") {
  return { transitions: [{ at, dur, type }] };
}
