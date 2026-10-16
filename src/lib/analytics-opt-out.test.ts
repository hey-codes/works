import assert from "node:assert/strict";
import { test } from "node:test";
import { optOutChoice } from "./analytics-opt-out.ts";

test("?notrack opts this browser out", () => {
  assert.equal(optOutChoice("?notrack"), true);
  assert.equal(optOutChoice("?notrack=1"), true);
});

test("?track opts this browser back in", () => {
  assert.equal(optOutChoice("?track"), false);
});

test("no flag in the URL leaves the stored choice alone", () => {
  assert.equal(optOutChoice(""), null);
  assert.equal(optOutChoice("?ref=linkedin"), null);
});

test("with both flags, notrack wins", () => {
  assert.equal(optOutChoice("?track&notrack"), true);
});
