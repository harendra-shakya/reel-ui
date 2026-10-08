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
  // warm / cinematic
  "teal-orange": "eq=saturation=1.2:contrast=1.05,colorbalance=rs=.15:gs=-.05:bs=-.15:rm=.1:gm=0:bm=-.1",
  "warm-fade": "curves=all='0/0.08 1/0.95',eq=saturation=1.1:contrast=0.95:brightness=0.03",
  "golden": "eq=saturation=1.25:contrast=1.03:brightness=0.02,colorbalance=rs=.2:gs=.08:bs=-.12",
  "sunset": "eq=saturation=1.35:contrast=1.08,colorbalance=rs=.25:bs=-.1:rm=.12",
  // cool / moody
  "noir": "hue=s=0,eq=contrast=1.1:brightness=-0.02",
  "cyber": "eq=saturation=1.4:contrast=1.1,colorbalance=gs=.15:bs=.2:rs=-.1",
  "arctic": "eq=saturation=0.85:contrast=1.05:brightness=0.05,colorbalance=bs=.15:rs=-.08",
  "midnight": "eq=saturation=0.9:contrast=1.15:brightness=-0.04,colorbalance=bs=.12:rs=-.05",
  // clean / social
  "vivid": "eq=saturation=1.5:contrast=1.08",
  "pastel": "eq=saturation=0.75:contrast=0.92:brightness=0.06",
  "mono-soft": "hue=s=0.15,eq=contrast=1.02",
  "vintage": "curves=all='0/0.1 0.5/0.55 1/0.9',eq=saturation=0.8:contrast=0.95,colorbalance=rs=.1:bs=-.08",
};

/** xfade names this ffmpeg accepts (from `ffmpeg -h filter=xfade`); unknown -> fade. */
const XFADES = new Set(("fade,wipeleft,wiperight,wipeup,wipedown,slideleft,slideright,slideup,slidedown,circlecrop,rectcrop,distance,fadeblack,fadewhite,radial,smoothleft,smoothright,smoothup,smoothdown,circleopen,circleclose,vertopen,vertclose,horzopen,horzclose,dissolve,pixelize,diagtl,diagtr,diagbl,diagbr,hlslice,hrslice,vuslice,vdslice,hblur,fadegrays,wipetl,wipetr,wipebl,wipebr,squeezeh,squeezev,zoomin,fadefast,fadeslow,hlwind,hrwind,vuwind,vdwind,coverleft,coverright,coverup,coverdown,revealleft,revealright,revealup,revealdown").split(","));
/** Friendly aliases agents may use -> real xfade names. */
const XFADE_ALIAS = { xfade: "fade", zoom: "zoomin", slide: "slideleft", wipe: "wipeleft", iris: "circleopen", blur: "hblur", glitch: "pixelize", reveal: "revealleft", cover: "coverleft" };
const xfadeOf = (t) => XFADES.has(t) ? t : (XFADE_ALIAS[t] || "fade");

/** Caption look per style: size rel to H, box, color. */
const CAPTIONS = {
  pop: { div: 28, box: ":box=1:boxcolor=black@0.6:boxborderw=24", color: "white" },
  karaoke: { div: 26, box: ":box=1:boxcolor=0xFACC15@0.9:boxborderw=20", color: "black" },
  minimal: { div: 30, box: "", color: "white" },
  neon: { div: 26, box: ":box=1:boxcolor=0x00E5FF@0.85:boxborderw=20", color: "black" },
  outline: { div: 27, box: "", color: "white" },
  memo: { div: 30, box: ":box=1:boxcolor=white@0.92:boxborderw=26", color: "black" },
};
/** Title look per style: size rel to H, y anchor, box, color. */
const TITLES = {
  hero: { div: 11, y: "(h-text_h)/2-80", box: "", color: "white" },
  "lower-third": { div: 18, y: "h-420", box: ":box=1:boxcolor=black@0.65:boxborderw=30", color: "white" },
  opener: { div: 13, y: "(h-text_h)/2", box: ":box=1:boxcolor=black@0.55:boxborderw=28", color: "white" },
  closer: { div: 14, y: "(h-text_h)/2", box: "", color: "0xFACC15" },
  quote: { div: 16, y: "(h-text_h)/2-40", box: "", color: "white" },
  chapter: { div: 20, y: "320", box: ":box=1:boxcolor=black@0.6:boxborderw=24", color: "white" },
};

/** Still motion (zoompan) or clip treatment for `effect`. Returns filter string or "". */
function clipEffect(effect, dur, fps, W, H) {
  const frames = Math.max(1, Math.round(dur * fps));
  switch (effect) {
    case "kenburns-in": case "kenburns-out": case "pan-left": case "pan-right":
      return kenburns(effect, dur, fps, W, H);
    case "zoom-blur": // punch-in ramp: quick zoom then hold (reads as crash-zoom)
      return `zoompan=z='min(1.0+1.2*on/${frames},1.6)':d=${frames}:s=${W}x${H}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':fps=${fps}`;
    case "shake": // handheld wobble via crop offsets
      return `scale=${W + 60}:${H + 60},crop=${W}:${H}:'(in_w-out_w)/2+20*sin(2*PI*t*3)':'(in_h-out_h)/2+14*cos(2*PI*t*2.3)'`;
    case "punch-in": // static jump closer
      return `scale=${W * 1.35}:${H * 1.35},crop=${W}:${H}`;
    case "flash": // hot white flash at head of clip
      return `eq=brightness='0.6*max(0,1-t*6)':saturation='1+0.5*max(0,1-t*6)'`;
    case "film-grain": // light grain
      return `noise=alls=8:allf=t,eq=contrast=1.03:saturation=0.95`;
    case "vhs": // chroma punch + tracking wobble feel
      return `curves=all='0/0.05 1/0.95',eq=saturation=1.3:contrast=1.05,noise=alls=10:allf=t,setsar=1`;
    default:
      return "";
  }
}

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

  // Per-clip video prep: scale/crop + motion/treatment effect.
  tl.tracks.forEach((c, i) => {
    let v = `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${fps}`;
    const fx = c.effect && c.effect !== "none" ? clipEffect(c.effect, c.dur, fps, W, H) : "";
    if (fx) v += `,${fx}`;
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
      const xf = xfadeOf(tr.type); // unknown names fall back to fade
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

  // Captions + titles as drawtext overlays (multi-line: stacked drawtexts, size rhythm).
  const overlays = [...tl.captions.map((c) => ({ ...c, kind: "cap" })), ...tl.titles.map((t) => ({ ...t, kind: "title" }))];
  overlays.forEach((o, k) => {
    const isTitle = o.kind === "title";
    const look = isTitle ? (TITLES[o.style] || TITLES.hero) : (CAPTIONS[o.style] || CAPTIONS.pop);
    const size = Math.round(H / look.div);
    const yBase = isTitle ? look.y : "h-340";
    const extra = (!isTitle && o.style === "outline") ? ":borderw=3:bordercolor=black" : "";
    const lines = isTitle ? [o.text, o.sub].filter(Boolean) : wrapWords(o.text);
    lines.forEach((line, li) => {
      const y = `(${yBase})+${li * Math.round(size * 1.35)}`;
      chains.push(`${tail}drawtext=fontfile=${ff}:text='${escDrawText(line)}':fontsize=${size}:fontcolor=${look.color}${look.box}${extra}:x=(w-text_w)/2:y=${y}:enable='between(t,${o.start},${o.end})'[t${k}_${li}]`);
      tail = `[t${k}_${li}]`;
    });
  });
  chains.push(`${tail}format=yuv420p[vout]`);

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
