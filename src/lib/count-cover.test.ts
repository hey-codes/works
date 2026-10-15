import assert from "node:assert/strict";
import { test } from "node:test";
import { coveredCounts } from "./count-cover.ts";

const circle = (id: number, x: number, y: number, sites: number) => ({ id, x, y, sites });

test("where two circles overlap, only the one with more sites keeps its count", () => {
  // Los Angeles (41 sites, 11px) and Beverly Hills (11 sites, 11px), 3px apart.
  const covered = coveredCounts([circle(1, 100, 100, 41), circle(2, 103, 100, 11)], false);
  assert.deepEqual([...covered], [2]);
});

test("the smaller count goes however slightly the circles overlap, and stays where they only touch", () => {
  // 15px and 11px radii: they overlap under 26px apart.
  assert.deepEqual([...coveredCounts([circle(1, 0, 0, 60), circle(2, 25.9, 0, 20)], false)], [2]);
  assert.deepEqual([...coveredCounts([circle(1, 0, 0, 60), circle(2, 26, 0, 20)], false)], []);
});

test("on phones the circles are smaller, so the same two overlap only under 19px apart", () => {
  // 11px and 8px radii there.
  assert.deepEqual([...coveredCounts([circle(1, 0, 0, 60), circle(2, 18.9, 0, 20)], true)], [2]);
  assert.deepEqual([...coveredCounts([circle(1, 0, 0, 60), circle(2, 19, 0, 20)], true)], []);
  // 22px apart: clear on a phone, overlapping on the desktop.
  assert.deepEqual([...coveredCounts([circle(1, 0, 0, 60), circle(2, 22, 0, 20)], true)], []);
  assert.deepEqual([...coveredCounts([circle(1, 0, 0, 60), circle(2, 22, 0, 20)], false)], [2]);
});

test("a circle that overlaps no other keeps its count, side by side or on a diagonal", () => {
  // 8px radii: 16px apart on a diagonal, where the boxes around them would overlap.
  assert.deepEqual([...coveredCounts([circle(1, 0, 0, 5), circle(2, 12, 12, 3), circle(3, 200, 0, 1)], false)], []);
});

test("between circles with as many sites, the higher id keeps its count, in any order", () => {
  assert.deepEqual([...coveredCounts([circle(7, 0, 0, 4), circle(3, 5, 0, 4)], false)], [3]);
  assert.deepEqual([...coveredCounts([circle(3, 5, 0, 4), circle(7, 0, 0, 4)], false)], [3]);
});

test("a circle overlapping a bigger one loses its count even when that one has lost its own", () => {
  // A (15px) at 0, B (11px) at 20, C (8px) at 36: B's disc (9 to 31)
  // overlaps A's, and C's disc (28 to 44) overlaps B's by 3px, though C's
  // centre lies outside it. The rule holds pair by pair, so B and C both go.
  const covered = coveredCounts([circle(1, 0, 0, 80), circle(2, 20, 0, 20), circle(3, 36, 0, 5)], false);
  assert.deepEqual([...covered].sort(), [2, 3]);
});
