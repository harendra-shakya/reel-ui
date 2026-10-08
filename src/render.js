/** Timeline -> ffmpeg filter graph + spawn. Requires system ffmpeg. Node 18+, zero deps. */
import { spawnSync } from "node:child_process";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { totalDuration } from "./schema.js";
import { escDrawText, wrapWords } from "./text.js";

/** Resolve a bold TTF/OTF for drawtext. */
export function resolveFont() {
  if (process.env.REEL_FONT && existsSync(process.env.REEL_FONT)) return process.env.REEL_FONT;
  for (const fam of ["Liberation Sans:bold", "DejaVu Sans:bold", "Montserrat:bold"]) {
    try {
      const f = execSync(`fc-match -v "${fam}"`, { encoding: "utf8" });
      const m = f.match(/file:\s*"([^"]+\.(ttf|otf))"/i);
      if (m && existsSync(m[1])) return m[1];
    } catch { /* next */ }
  }
  return "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf";
}

const GRADES = {
  "none": "",
  "teal-orange": "eq=saturation=1.2:contrast=1.05,colorbalance=rs=.15:gs=-.05:bs=-.15:rm=.1:gm=0:bm=-.1",
  "noir": "hue=s=0,eq=contrast=1.1:brightness=-0.02",
  "warm-fade": "curves=all='0/0.08 1/0.95',eq=saturation=1.1:contrast=0.95:brightness=0.03",
};

/** Kenburns zoompan expr for a still of `dur` seconds at `fps`. */
function kenburns(effect, dur, fps, W, H) {
  const frames = Math.max(1, Math.round(dur * fps));
  const zoom = effect === "kenburns-out"
    ? `max(1.5-0.5*on/${frames},1.0)`
    : `min(1.0+0.5*on/${frames},1.5)`;
  const pan = effect === "pan-left" ? `x='(iw-iw/zoom)*(1-on/${frames})':y='(ih-ih/zoom)/2'`
    : effect === "pan-right" ? `x='(iw-iw/zoom)*(on/${frames})':y='(ih-ih/zoom)/2'`
    : `x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'`;
  return `zoompan=z='${zoom}':d=${frames}:s=${W}x${H}:${pan}:fps=${fps}`;
}

/**
 * Build ffmpeg args for a normalized timeline.
 * @returns {{args: string[], duration: number}}
 */
export function buildFilterGraph(tl, { font } = {}) {
  const { width: W, height: H, fps } = tl.meta;
  const ff = font || resolveFont();
  const duration = totalDuration(tl);
  const inputs = [];
  const chains = [];
  const bg = tl.meta.bg.replace("#", "0x");

  tl.tracks.forEach((c, i) => {
    if (c.kind === "video") inputs.push("-i", c.src);
    else inputs.push("-loop", "1", "-t", String(c.dur), "-i", c.src);
  });
  if (tl.audio.music) { inputs.push("-stream_loop", "-1", "-i", tl.audio.music); }

  // Per-clip video prep: scale/crop + still motion.
  tl.tracks.forEach((c, i) => {
    let v = `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${fps}`;
    if (c.kind !== "video" && c.effect && c.effect !== "none") v += `,${kenburns(c.effect, c.dur, fps, W, H)}`;
    v += `,settb=AVTB[v${i}]`;
    chains.push(v);
  });

  // Concat with xfade chain (offset = running end - transition dur).
  const musicIdx = tl.audio.music ? tl.tracks.length : -1;
  let vOut = "[v0]";
  if (tl.tracks.length > 1) {
    let end = tl.tracks[0].start + tl.tracks[0].dur;
    tl.transitions.slice(0, tl.tracks.length - 1).forEach((tr, k) => {
      const d = Math.min(tr.dur, 1);
      const off = Math.max(0, end - d);
      const xf = tr.type === "zoom" ? "circleopen" : tr.type === "slide" ? "slideleft" : "fade"; // ponytail: xfade has no zoom; circleopen iris reads as zoom-in
      chains.push(`${vOut}[v${k + 1}]xfade=transition=${xf}:duration=${d}:offset=${off}[x${k}]`);
      vOut = `[x${k}]`;
      end = end + (tl.tracks[k + 1].dur - d); // next end minus overlap
    });
    // Clips without explicit transitions: plain concat fallback.
    const nTr = Math.min(tl.transitions.length, tl.tracks.length - 1);
    if (nTr < tl.tracks.length - 1) {
      const rest = tl.tracks.map((_, i) => (i <= nTr ? null : `[v${i}]`)).filter(Boolean).join("");
      if (rest) { chains.push(`${vOut}${rest}concat=n=${tl.tracks.length - nTr}:v=1:a=0[cc]`); vOut = "[cc]"; }
    }
  }

  let tail = vOut;
  const grade = GRADES[tl.grade] || "";
  if (grade) { chains.push(`${tail}${grade}[g]`); tail = "[g]"; }

  // Captions + titles as drawtext overlays.
  const overlays = [...tl.captions.map((c) => ({ ...c, kind: "cap" })), ...tl.titles.map((t) => ({ ...t, kind: "title" }))];
  overlays.forEach((o, k) => {
    const isTitle = o.kind === "title";
    const size = isTitle ? Math.round(H / 11) : Math.round(H / 28);
    const y = isTitle ? "(h-text_h)/2-80" : "h-280";
    const box = isTitle ? "" : ":box=1:boxcolor=black@0.6:boxborderw=24";
    const lines = isTitle ? [o.text, o.sub].filter(Boolean) : wrapWords(o.text);
    const txt = escDrawText(lines.join(isTitle ? "\\n" : " "));
    chains.push(`${tail}drawtext=fontfile=${ff}:text='${txt}':fontsize=${size}:fontcolor=white${box}:x=(w-text_w)/2:y=${y}:enable='between(t,${o.start},${o.end})'[t${k}]`);
    tail = `[t${k}]`;
  });
  chains.push(`${tail}format=yuv420p,drawbox=c=${bg}:t=fill[vout]`);

  // Audio: music bed + duck under narration (input 0 assumed narration when video clips have audio) + fade out.
  const aParts = [];
  if (tl.audio.music) {
    const db = tl.audio.musicDb ?? -20;
    aParts.push(`[${musicIdx}:a]volume=${db}dB,atrim=0:${duration},asetpts=PTS-STARTPTS[m]`);
    // ponytail: duck via sidechaincompress keyed on first clip audio; falls back to plain mix if no narration track
    if (tl.audio.duck) aParts.push(`[0:a][m]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=400[mduck]`);
    const msrc = tl.audio.duck ? "[mduck]" : "[m]";
    aParts.push(`${msrc}afade=t=out:st=${Math.max(0, duration - (tl.audio.fadeOut ?? 1))}:d=${tl.audio.fadeOut ?? 1},aformat=sample_fmts=fltp:channel_layouts=stereo[aout]`);
  }

  const filter = [...chains, ...aParts].join(";");
  const args = [...inputs, "-filter_complex", filter, "-map", "[vout]"];
  if (tl.audio.music) args.push("-map", "[aout]", "-shortest");
  args.push("-t", String(duration), "-r", String(fps), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20");
  if (tl.audio.music) args.push("-c:a", "aac");
  return { args, duration };
}

/** Validate-free render: caller normalizes first. */
export function renderTimeline(tl, { out = "out.mp4", font } = {}) {
  const { args } = buildFilterGraph(tl, { font });
  const r = spawnSync("ffmpeg", ["-y", ...args, out], { encoding: "utf8" });
  if (r.status !== 0) {
    const tail = (r.stderr || "").split("\n").slice(-15).join("\n");
    throw new Error(`ffmpeg failed (code ${r.status}):\n${tail}`);
  }
  return out;
}
