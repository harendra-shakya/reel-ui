/** Apply Ken Burns motion to a clip. @param {object} clip @param {"kenburns-in"|"kenburns-out"|"pan-left"|"pan-right"} [effect="kenburns-in"] */
export function effectKenburns(clip, effect = "kenburns-in") {
  return { tracks: [{ ...clip, effect }] };
}
