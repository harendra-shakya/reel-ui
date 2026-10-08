# reel-ui skill — video editing for agents

The whole edit is one JSON timeline. Pick a template, swap sources, render.

## Recipe

1. `node src/cli.js list` — browse blocks/templates/styles
2. `node src/cli.js add template <name>` — copy starter
3. Edit: swap `tracks[].src`, rewrite `captions[]`/`titles[]`
4. `node src/cli.js render timelines/x.json -o out.mp4`

## IR reference (compact)

- `meta`: name, width/height (default 1080x1920), fps (30), bg (#000000)
- `tracks[]`: src, start, dur, kind (image|video|color), effect (kenburns-in|kenburns-out|pan-left|pan-right|none)
- `captions[]`: start, end, text, style (pop|karaoke|minimal)
- `titles[]`: start, end, text, sub?, style (hero|lower-third)
- `transitions[]`: at (cut seconds), dur (0.5), type (xfade|zoom|slide)
- `grade`: none|teal-orange|noir|warm-fade
- `audio`: music, musicDb (-20), duck (bool), fadeOut (1)

## Skeletons (copy-paste)

Talking head:
```json
{"version":1,"meta":{"name":"take"},"tracks":[{"src":"a.mp4","start":0,"dur":4,"kind":"video"}],"captions":[{"start":0,"end":2,"text":"hook line","style":"pop"}],"grade":"warm-fade","audio":{}}
```

Kenburns quote:
```json
{"version":1,"meta":{"name":"quote"},"tracks":[{"src":"bg.jpg","start":0,"dur":6,"kind":"image","effect":"kenburns-in"}],"captions":[{"start":0.5,"end":5.5,"text":"the quote","style":"karaoke"}],"grade":"noir"}
```

Teaser (zoom cuts):
```json
{"version":1,"meta":{"name":"teaser"},"tracks":[{"src":"a.jpg","start":0,"dur":3,"kind":"image","effect":"kenburns-in"},{"src":"b.jpg","start":3,"dur":3,"kind":"image","effect":"pan-right"}],"transitions":[{"at":3,"dur":0.6,"type":"zoom"}],"grade":"teal-orange","audio":{}}
```

## Constraints

- drawtext captions are line-level: no per-word karaoke timing
- captions wrap to max 2 lines (~22 chars each)
- font: `REEL_FONT` env or fc-match auto-detect (Liberation/DejaVu/Montserrat bold)
- images looped per-clip; video clips keep native audio for ducking key
- default canvas 1080x1920@30fps unless meta overrides
