import assert from "node:assert/strict";
import { test } from "node:test";
import { publicTextProblems } from "./public-text.ts";

const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);

const strict = { dollars: false };

test("clean text has no problems, ISO dates and ranges included", () => {
  assert.deepEqual(publicTextProblems("13 years, 400+ locations, 2.8M+ sq ft, 2018 to 2021, 2026-10-29", strict), []);
});

test("an email address is a problem", () => {
  const p = publicTextProblems("write to a@b.co", strict);
  assert.equal(p.length, 1);
  assert.match(String(p[0]), /email/);
});

test("a phone number is a problem, in either common shape", () => {
  for (const t of ["555-201-4477", "(555) 201 4477"]) {
    const p = publicTextProblems(t, strict);
    assert.equal(p.length, 1, t);
    assert.match(String(p[0]), /phone/);
  }
});

test("a street address is a problem", () => {
  const p = publicTextProblems("12 Main Street", strict);
  assert.equal(p.length, 1);
  assert.match(String(p[0]), /street address/);
});

test("Montrose is a problem", () => {
  const p = publicTextProblems("Montrose, CO", strict);
  assert.equal(p.length, 1);
  assert.match(String(p[0]), /Montrose/);
});

test("em and en dashes are problems", () => {
  const dashes: [string, string][] = [[`a${EM}b`, "em dash"], [`a${EN}b`, "en dash"]];
  for (const [t, name] of dashes) {
    const p = publicTextProblems(t, strict);
    assert.equal(p.length, 1, name);
    assert.match(String(p[0]), new RegExp(name));
  }
});

test("a dollar figure is a problem only where dollars are not allowed", () => {
  const p = publicTextProblems("$5M+", strict);
  assert.equal(p.length, 1);
  assert.match(String(p[0]), /dollar/);
  assert.deepEqual(publicTextProblems("$5M+", { dollars: true }), []);
});
