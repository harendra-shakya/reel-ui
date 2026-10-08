import { test } from "node:test";
import assert from "node:assert/strict";
import { isTimeline, normalize, totalDuration } from "../src/schema.js";
import { escDrawText, wrapWords } from "../src/text.js";
import { buildFilterGraph } from "../src/render.js";

test("rejects empty tracks", () => {
  assert.equal(isTimeline({ version: 1, meta: { name: "x" }, tracks: [] }).ok, false);
});
test("normalize fills defaults", () => {
  const n = normalize({ version: 1, meta: { name: "x" }, tracks: [{ src: "a.jpg", start: 0, dur: 2, kind: "image" }] });
  assert.equal(n.meta.width, 1080);
  assert.equal(n.tracks[0].effect, "none");
  assert.equal(totalDuration(n), 2);
});
test("drawtext escaping", () => {
  assert.equal(escDrawText("it's: 100%"), "it\\'s\\: 100\\%");
  assert.deepEqual(wrapWords("one two three four", 9), ["one two", "three", "four"]); // no truncation: all lines returned
});
test("filter graph builds for quote-card template", async () => {
  const fs = await import("node:fs");
  const tl = normalize(JSON.parse(fs.readFileSync("registry/templates/quote-card/template.json", "utf8")));
  const { args, duration } = buildFilterGraph(tl, {});
  assert.equal(duration, 8);
  assert.ok(args.includes("-filter_complex"));
  assert.ok(args.join(" ").includes("zoompan"));
  assert.ok(args.join(" ").includes("drawtext"));
});
test("every template validates", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const dir = "registry/templates";
  for (const name of fs.readdirSync(dir)) {
    const f = path.join(dir, name, "template.json");
    if (!fs.existsSync(f)) continue;
    const { ok, errors } = isTimeline(JSON.parse(fs.readFileSync(f, "utf8")));
    assert.ok(ok, `${f}: ${errors.join("; ")}`);
  }
});
test("grades x transitions x effects x styles matrix builds", () => {
  const grades = ["none", "teal-orange", "warm-fade", "golden", "sunset", "noir", "cyber", "arctic", "midnight", "vivid", "pastel", "mono-soft", "vintage"];
  const types = ["fade", "dissolve", "pixelize", "hblur", "zoomin", "smoothleft", "coverleft", "revealleft", "wipeleft", "slideleft", "circleopen", "radial", "zoom", "slide", "xfade", "bogus-name"];
  const effects = ["none", "kenburns-in", "kenburns-out", "pan-left", "pan-right", "shake", "zoom-blur", "punch-in", "flash", "film-grain", "vhs"];
  for (const grade of grades) {
    const tl = normalize({ version: 1, meta: { name: "m" }, grade,
      tracks: [{ src: "a.jpg", start: 0, dur: 2, kind: "image", effect: effects[grades.indexOf(grade) % effects.length] }, { src: "b.jpg", start: 2, dur: 2, kind: "image" }],
      captions: [{ start: 0, end: 2, text: "one two three four five six seven", style: "neon" }],
      titles: [{ start: 0, end: 1, text: "T", sub: "s", style: "opener" }],
      transitions: [{ at: 2, dur: 0.5, type: types[grades.indexOf(grade) % types.length] }], audio: {} });
    const { args } = buildFilterGraph(tl, {});
    assert.ok(args.join(" ").includes("xfade="), grade);
  }
});
