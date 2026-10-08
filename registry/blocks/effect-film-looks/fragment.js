/** Analog treatment. @param {object} clip @param {"film-grain"|"vhs"} [effect="film-grain"] */
export function effectFilmLooks(clip, effect = "film-grain") {
  return { tracks: [{ ...clip, effect }] };
}
