// The marks must read against the basemap in both themes: WCAG asks 3:1 for
// graphics. Ground and water are CARTO's (positron and dark-matter style.json,
// background and water fills, checked 2026-10-14); the tokens are the site's.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const THEMES = {
  light: { tokens: { ink: "#37352f", blue: "#0070e0", red: "#e10b00" }, ground: "#fafaf8", water: "#d4dadc" },
  dark: { tokens: { ink: "#ebe8e2", blue: "#4da3ff", red: "#ff453a" }, ground: "#0e0e0e", water: "#2c353c" },
};

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
};

test("the tokens the test assumes are the ones globals.css defines", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8").toLowerCase();
  for (const theme of Object.values(THEMES)) for (const value of Object.values(theme.tokens)) assert.ok(css.includes(value), `${value} not in globals.css`);
});

for (const [name, theme] of Object.entries(THEMES)) {
  for (const [token, color] of Object.entries(theme.tokens)) {
    test(`${name}: ${token} marks keep 3:1 on the ground and on water`, () => {
      assert.ok(contrast(color, theme.ground) >= 3, `${token} on ground ${contrast(color, theme.ground).toFixed(2)}`);
      assert.ok(contrast(color, theme.water) >= 3, `${token} on water ${contrast(color, theme.water).toFixed(2)}`);
    });
  }
}
