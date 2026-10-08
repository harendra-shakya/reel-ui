#!/bin/sh
# Smoke test: proves the ffmpeg toolchain (color bars + drawtext), no repo assets needed.
set -e
FONT="${REEL_FONT:-/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf}"
ffmpeg -y -f lavfi -i "testsrc2=size=1080x1920:rate=30:duration=3" \
  -vf "drawtext=fontfile=${FONT}:text='reel-ui smoke':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  -c:v libx264 -preset veryfast -crf 20 smoke.mp4
echo "smoke.mp4 ok"
# Full render (needs network for picsum placeholders):
# node ../src/cli.js render talking-head.json -o out.mp4
