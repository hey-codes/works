import assert from "node:assert/strict";
import { test } from "node:test";
import { OPT_OUT_KEY, optedOut, optOutChoice } from "./analytics-opt-out.ts";

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

function memoryStorage(initial?: string) {
  const m = new Map<string, string>(initial ? [[OPT_OUT_KEY, initial]] : []);
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

test("?notrack opts out and is remembered", () => {
  const s = memoryStorage();
  assert.equal(optedOut("?notrack", s), true);
  assert.equal(s.getItem(OPT_OUT_KEY), "1");
});

test("?track opts back in and forgets the choice", () => {
  const s = memoryStorage("1");
  assert.equal(optedOut("?track", s), false);
  assert.equal(s.getItem(OPT_OUT_KEY), null);
});

test("with no flag, the remembered choice decides", () => {
  assert.equal(optedOut("", memoryStorage("1")), true);
  assert.equal(optedOut("", memoryStorage()), false);
});

test("without storage, only the URL decides", () => {
  assert.equal(optedOut("?notrack", null), true);
  assert.equal(optedOut("", null), false);
});

test("storage that throws counts as none", () => {
  const broken = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
    removeItem: () => {
      throw new Error("blocked");
    },
  };
  assert.equal(optedOut("?notrack", broken), true);
  assert.equal(optedOut("", broken), false);
});
