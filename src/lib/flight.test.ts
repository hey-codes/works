import assert from "node:assert/strict";
import { test } from "node:test";
import { flightMs } from "./flight.ts";

test("a hop with no zoom change takes the minimum", () => {
  assert.equal(flightMs(5, 5), 900);
});

test("a flight in grows with the zoom travelled", () => {
  assert.equal(flightMs(2.6, 5), 1260);
  assert.equal(flightMs(2.6, 11), 2160);
});

test("a flight back out runs at 0.8 of the flight in", () => {
  assert.equal(flightMs(11, 2.6), 1728);
});

test("no flight runs past the maximum", () => {
  assert.equal(flightMs(2, 16), 2500);
  assert.equal(flightMs(16, 2), 2000);
});
