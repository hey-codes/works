import assert from "node:assert/strict";
import { test } from "node:test";
import { atlasReducer, initialAtlasState, mapFocus, type Pick, samePick, selectedRole, shownPick } from "./atlas-reducer.ts";

const run = (...actions: Parameters<typeof atlasReducer>[1][]) => actions.reduce(atlasReducer, initialAtlasState);
const role = (r: number): Pick => ({ kind: "role", role: r });
const sys = (name: string): Pick => ({ kind: "sys", name });
// FEXA was used at roles 0 and 4 in this model; anything else at none.
const rolesOf = (name: string) => (name === "FEXA" ? [4, 0] : []);
const wide = (s: ReturnType<typeof run>) => mapFocus(s, rolesOf, false);

test("clicking a row from 960px opens its record and picks it", () => {
  const s = run({ type: "toggle", role: 3, single: true });
  assert.deepEqual(s.open, [3]);
  assert.equal(selectedRole(s), 3);
});

test("one pick at a time: another row closes the first record and takes over", () => {
  const s = run({ type: "toggle", role: 3, single: true }, { type: "toggle", role: 5, single: true });
  assert.deepEqual(s.open, [5]);
  assert.equal(selectedRole(s), 5);
});

test("clicking the picked row again closes it and clears the pick", () => {
  const s = run({ type: "toggle", role: 3, single: true }, { type: "toggle", role: 3, single: true });
  assert.deepEqual(s.open, []);
  assert.equal(s.pick, null);
});

test("picking a system closes the picked role's record and takes over", () => {
  const s = run({ type: "toggle", role: 3, single: true }, { type: "pickSys", name: "FEXA" });
  assert.deepEqual(s.open, []);
  assert.ok(samePick(s.pick, sys("FEXA")));
});

test("picking the picked system again clears it", () => {
  const s = run({ type: "pickSys", name: "FEXA" }, { type: "pickSys", name: "FEXA" });
  assert.equal(s.pick, null);
});

test("clear (Esc, Show every site) drops the pick and closes its record", () => {
  const s = run({ type: "toggle", role: 3, single: true }, { type: "clear" });
  assert.deepEqual(s, initialAtlasState);
});

test("a site card's Role picks its role and never closes it", () => {
  const s = run({ type: "toggle", role: 3, single: true }, { type: "pickRole", role: 3, single: true });
  assert.deepEqual(s.open, [3]);
  assert.equal(selectedRole(s), 3);
});

test("under 960px rows open and close on their own and nothing is picked", () => {
  const s = run({ type: "toggle", role: 3, single: false }, { type: "toggle", role: 5, single: false });
  assert.deepEqual(s.open, [3, 5]);
  assert.equal(s.pick, null);
  assert.deepEqual(run({ type: "toggle", role: 3, single: false }, { type: "toggle", role: 3, single: false }).open, []);
});

test("a click ends the hover's preview, so clearing under the pointer shows every site", () => {
  const s = run({ type: "hover", pick: role(3) }, { type: "toggle", role: 3, single: true }, { type: "toggle", role: 3, single: true });
  assert.equal(s.hov, null);
  assert.deepEqual(wide(s), { shown: null, frame: null, tint: [] });
});

test("with nothing picked or hovered the map shows and frames every site", () => {
  assert.deepEqual(wide(initialAtlasState), { shown: null, frame: null, tint: [] });
});

test("a hover filters in place: its sites alone, the camera where it was", () => {
  const s = run({ type: "hover", pick: role(2) });
  assert.deepEqual(wide(s), { shown: [2], frame: null, tint: [] });
});

test("a hover previews over the pick, and the camera stays on the pick", () => {
  const s = run({ type: "toggle", role: 4, single: true }, { type: "hover", pick: role(2) });
  assert.deepEqual(wide(s), { shown: [2], frame: [4], tint: [] });
  assert.ok(samePick(shownPick(s), role(2)));
});

test("a system shows and frames every role that used it, ascending", () => {
  const s = run({ type: "pickSys", name: "FEXA" });
  assert.deepEqual(wide(s), { shown: [0, 4], frame: [0, 4], tint: [] });
});

test("the narrow layout never drives the map", () => {
  const s = run({ type: "toggle", role: 4, single: true }, { type: "hover", pick: role(2) });
  assert.deepEqual(mapFocus(s, rolesOf, true), { shown: null, frame: null, tint: [] });
});

test("the same hover twice leaves the state as it was", () => {
  const s = run({ type: "hover", pick: sys("FEXA") });
  assert.equal(atlasReducer(s, { type: "hover", pick: sys("FEXA") }), s);
});
