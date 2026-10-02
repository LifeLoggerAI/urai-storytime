import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../../src/app/globals.css", import.meta.url), "utf8");

test("Storytime grid children may shrink inside narrow viewports", () => {
  assert.match(css, /\.storytime-grid\s*>\s*\*\s*\{\s*min-width:\s*0;\s*\}/);
});

test("Storytime cards wrap long status/configuration strings", () => {
  assert.match(css, /\.storytime-card\s*\{[^}]*overflow-wrap:\s*anywhere;/s);
});

test("mobile compact grid uses a zero-minimum track", () => {
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*\.storytime-grid,\s*\.storytime-grid\.compact\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);\s*\}/
  );
});
