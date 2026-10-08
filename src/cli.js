#!/usr/bin/env node
/** reel CLI: init / add / render / list. Zero deps. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from "node:fs";
import { isTimeline, normalize } from "./schema.js";
import { renderTimeline } from "./render.js";

const REG = new URL("../registry.json", import.meta.url);

function list() {
  const reg = JSON.parse(readFileSync(REG, "utf8"));
  for (const [section, items] of Object.entries(reg)) {
    console.log(`\n## ${section}`);
    if (Array.isArray(items)) { for (const s of items) console.log(`  - ${s}`); continue; }
    for (const [name, v] of Object.entries(items)) console.log(`  - ${name}: ${v.desc || v.file || ""}`);
  }
}

function init() {
  mkdirSync("timelines", { recursive: true });
  if (!existsSync("reel.config.json"))
    writeFileSync("reel.config.json", JSON.stringify({ width: 1080, height: 1920, fps: 30, font: "" }, null, 2) + "\n");
  console.log("reel-ui initialized: reel.config.json + timelines/");
}

function add(type, name) {
  const reg = JSON.parse(readFileSync(REG, "utf8"));
  const group = reg[type + "s"];
  const entry = group && group[name];
  if (!entry) throw new Error(`unknown ${type} "${name}" — see: reel list`);
  const src = new URL(`../${entry.file}`, import.meta.url);
  const dest = `${type}s/${name}.json`;
  mkdirSync(`${type}s`, { recursive: true });
  copyFileSync(src, dest);
  console.log(`added ${type} "${name}" -> ${dest}`);
}

function render(file, out) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const tl = raw.template || raw;
  const { ok, errors } = isTimeline(tl);
  if (!ok) throw new Error("invalid timeline:\n- " + errors.join("\n- "));
  const n = normalize(tl);
  const target = out || `out-${Date.now()}.mp4`;
  renderTimeline(n, { out: target });
  console.log(`rendered ${target}`);
}

const [cmd, a, b] = process.argv.slice(2);
try {
  if (cmd === "list") list();
  else if (cmd === "init") init();
  else if (cmd === "add") add(a, b);
  else if (cmd === "render") render(a, b === "-o" ? process.argv[5] : b);
  else if (!cmd) { console.log("usage: reel <init|list|add <type> <name>|render <timeline.json> [-o out.mp4]>"); }
  else throw new Error(`unknown command "${cmd}"`);
} catch (e) {
  console.error("error:", e.message);
  process.exit(1);
}
