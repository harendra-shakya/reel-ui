/** Punch zoom treatment. @param {object} clip @param {"zoom-blur"|"punch-in"|"flash"} [effect="zoom-blur"] */
export function effectPunchZoom(clip, effect = "zoom-blur") {
  return { tracks: [{ ...clip, effect }] };
}
