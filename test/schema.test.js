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
  assert.deepEqual(wrapWords("one two three four", 9), ["one two", "three four"]);
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
