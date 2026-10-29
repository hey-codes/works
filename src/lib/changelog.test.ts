import assert from "node:assert/strict";
import { test } from "node:test";
import { latestEntryDate } from "./changelog.ts";

test("the newest entry is the first dated heading", () => {
  assert.equal(latestEntryDate("# Changelog\n\n## 2026-10-29\n- a\n\n## 2026-10-15\n- b\n"), "2026-10-29");
});

test("an undated heading before it is skipped", () => {
  assert.equal(latestEntryDate("# Changelog\n\n## Unreleased\n- a\n\n## 2026-10-15\n- b\n"), "2026-10-15");
});

test("a changelog with no dated entry throws", () => {
  assert.throws(() => latestEntryDate("# Changelog\n"), /no dated entry/);
});

test("a heading counts only when it is the date alone", () => {
  assert.throws(() => latestEntryDate("## 2026-10-29 extra\n- a\n"), /no dated entry/);
});
