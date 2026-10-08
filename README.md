# reel-ui — shadcn for video editing

Copy-paste **blocks**, **templates**, and **styles** that compile a JSON
timeline into an ffmpeg render. Zero deps: node 18+ + system ffmpeg.
Built for agents: the whole edit is one JSON file.

## Quickstart

```bash
node src/cli.js init                 # scaffold reel.config.json + timelines/
node src/cli.js list                 # browse blocks / templates / styles
node src/cli.js add template talking-head   # copy into ./templates/
node src/cli.js render timelines/my.json -o out.mp4
```

Font: `REEL_FONT=/path/to/Bold.ttf` or auto-detected via `fc-match`.

## Timeline IR

```json
{
  "version": 1,
  "meta": { "name": "my-video", "width": 1080, "height": 1920, "fps": 30 },
  "tracks": [{ "src": "clip.mp4", "start": 0, "dur": 4, "kind": "video" }],
  "captions": [{ "start": 0, "end": 2, "text": "hook", "style": "pop" }],
  "titles": [{ "start": 0, "end": 2, "text": "TITLE", "sub": "sub", "style": "hero" }],
  "transitions": [{ "at": 4, "dur": 0.5, "type": "xfade" }],
  "grade": "warm-fade",
  "audio": { "music": "bed.mp3", "musicDb": -20, "duck": true, "fadeOut": 1 }
}
```

## Registry layout

```
registry/
  blocks/<name>/block.json + fragment.js + README.md   # composable pieces
  templates/<name>/template.json + README.md           # full timelines
  styles/grades.json | captions.json | audio.json      # look presets
```

Limits: drawtext captions are line-level (no per-word karaoke timing),
max 2 wrapped lines, 1080x1920 default. See `SKILL.md` for the agent recipe.
