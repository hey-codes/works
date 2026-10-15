import assert from "node:assert/strict";
import { test } from "node:test";
import { atlasReducer, initialAtlasState, litRoles, mapFocus, selectedRole } from "./atlas-reducer.ts";

const run = (...actions: Parameters<typeof atlasReducer>[1][]) => actions.reduce(atlasReducer, initialAtlasState);

test("opening a row selects it", () => {
  const s = run({ type: "toggle", role: 3 });
  assert.deepEqual(s.openOrder, [3]);
  assert.equal(selectedRole(s), 3);
});

test("the most recently opened row is the selected one", () => {
  const s = run({ type: "toggle", role: 3 }, { type: "toggle", role: 5 });
  assert.equal(selectedRole(s), 5);
});

test("closing one of two open rows selects the other", () => {
  const s = run({ type: "toggle", role: 3 }, { type: "toggle", role: 5 }, { type: "toggle", role: 5 });
  assert.deepEqual(s.openOrder, [3]);
  assert.equal(selectedRole(s), 3);
});

test("closing the only open row selects nothing", () => {
  const s = run({ type: "toggle", role: 3 }, { type: "toggle", role: 3 });
  assert.equal(selectedRole(s), null);
});

test("open on an already open row moves it to the front without closing it", () => {
  const s = run({ type: "toggle", role: 3 }, { type: "toggle", role: 5 }, { type: "open", role: 3 });
  assert.deepEqual(s.openOrder, [5, 3]);
  assert.equal(selectedRole(s), 3);
});

test("pinning a system twice unpins it", () => {
  const s = run({ type: "sysToggle", name: "FEXA" }, { type: "sysToggle", name: "FEXA" });
  assert.equal(s.sysPin, null);
});

test("focus with nothing going on is empty", () => {
  assert.deepEqual(mapFocus(initialAtlasState, null, false), { tint: [], selected: null, frame: null });
});

test("hover tints without selecting", () => {
  const s = run({ type: "hover", role: 2 });
  assert.deepEqual(mapFocus(s, null, false), { tint: [2], selected: null, frame: null });
});

test("a brand shown alone is not tinted; a hovered role still is", () => {
  const s = run({ type: "toggle", role: 4 }, { type: "hover", role: 2 });
  assert.deepEqual(mapFocus(s, null, false), { tint: [2], selected: 4, frame: 4 });
});

test("hovering the selected role does not list it twice", () => {
  const s = run({ type: "toggle", role: 4 }, { type: "hover", role: 4 });
  assert.deepEqual(mapFocus(s, null, false), { tint: [4], selected: 4, frame: 4 });
});

test("a traced system takes over the tint and dims nothing", () => {
  const s = run({ type: "toggle", role: 4 });
  const focus = mapFocus(s, [0, 7], false);
  assert.deepEqual(focus.tint, [0, 7]);
  assert.equal(focus.selected, null);
});

test("a trace leaves the camera on the open role", () => {
  const s = run({ type: "toggle", role: 4 });
  assert.equal(mapFocus(s, [0, 7], false).frame, 4);
});

test("a trace with no role open frames every site", () => {
  assert.equal(mapFocus(initialAtlasState, [0, 7], false).frame, null);
});

test("the narrow layout never drives the map", () => {
  const s = run({ type: "toggle", role: 4 }, { type: "hover", role: 2 });
  assert.deepEqual(mapFocus(s, [0], true), { tint: [], selected: null, frame: null });
});

test("show every site returns the map to every brand and keeps the row open", () => {
  const s = run({ type: "toggle", role: 4 }, { type: "showAll" });
  assert.deepEqual(s.openOrder, [4]);
  assert.deepEqual(mapFocus(s, null, false), { tint: [4], selected: null, frame: null });
});

test("opening a job after that shows that brand alone again, untinted", () => {
  const s = run({ type: "toggle", role: 4 }, { type: "showAll" }, { type: "toggle", role: 2 });
  assert.deepEqual(mapFocus(s, null, false), { tint: [], selected: 2, frame: 2 });
});

test("reopening the same job from a site card shows its brand again", () => {
  const s = run({ type: "toggle", role: 4 }, { type: "showAll" }, { type: "open", role: 4 });
  assert.equal(mapFocus(s, null, false).selected, 4);
});

test("closing the row ends the every-brand view too", () => {
  const s = run({ type: "toggle", role: 4 }, { type: "showAll" }, { type: "toggle", role: 4 }, { type: "toggle", role: 6 });
  assert.equal(mapFocus(s, null, false).selected, 6);
});

test("closing one of two open rows keeps every brand on the map", () => {
  const s = run({ type: "toggle", role: 4 }, { type: "toggle", role: 6 }, { type: "showAll" }, { type: "toggle", role: 4 });
  assert.deepEqual(s.openOrder, [6]);
  assert.equal(mapFocus(s, null, false).selected, null);
  assert.equal(mapFocus(s, null, false).frame, null);
});

test("the list lights the hovered and the open rows", () => {
  const s = run({ type: "toggle", role: 4 }, { type: "hover", role: 2 });
  assert.deepEqual(litRoles(s, null, false), [2, 4]);
});

test("a trace lights the rows that used the system", () => {
  const s = run({ type: "toggle", role: 4 });
  assert.deepEqual(litRoles(s, [0, 7], false), [0, 7]);
});

test("the narrow layout lights no rows", () => {
  const s = run({ type: "toggle", role: 4 }, { type: "hover", role: 2 });
  assert.deepEqual(litRoles(s, null, true), []);
});
