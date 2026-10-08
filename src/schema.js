/** Timeline validation + normalization. Zero deps. */

/** @returns {{ok: boolean, errors: string[]}} */
export function isTimeline(tl) {
  const errors = [];
  if (!tl || typeof tl !== "object") return { ok: false, errors: ["timeline must be an object"] };
  if (tl.version !== 1) errors.push("version must be 1");
  if (!tl.meta || typeof tl.meta.name !== "string") errors.push("meta.name (string) required");
  if (!Array.isArray(tl.tracks) || tl.tracks.length === 0) errors.push("tracks[] must be non-empty");
  for (const [i, c] of (tl.tracks || []).entries()) {
    if (typeof c.src !== "string") errors.push(`tracks[${i}].src required`);
    if (typeof c.start !== "number" || typeof c.dur !== "number" || c.dur <= 0)
      errors.push(`tracks[${i}].start/dur must be numbers, dur > 0`);
  }
  return { ok: errors.length === 0, errors };
}

/** Fill defaults. Never mutates input. */
export function normalize(tl) {
  const t = structuredClone(tl);
  t.meta = { width: 1080, height: 1920, fps: 30, bg: "#000000", ...t.meta };
  t.grade ??= "none";
  t.audio ??= {};
  t.captions ??= [];
  t.titles ??= [];
  t.transitions ??= [];
  for (const c of t.tracks) c.effect ??= "none";
  for (const tr of t.transitions) tr.dur ??= 0.5;
  t.tracks.sort((a, b) => a.start - b.start);
  return t;
}

/** Total timeline duration = max track end. */
export function totalDuration(tl) {
  return Math.max(0, ...tl.tracks.map((c) => c.start + c.dur));
}
