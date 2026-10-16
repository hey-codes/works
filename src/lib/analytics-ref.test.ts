import assert from "node:assert/strict";
import { test } from "node:test";
import { withRefPath } from "./analytics-ref.ts";

test("?ref moves into the path, where the dashboard shows it", () => {
  assert.equal(withRefPath("https://codymitch.works/?ref=linkedin"), "https://codymitch.works/ref/linkedin");
});

test("the source is lowercased and reduced to a slug", () => {
  assert.equal(withRefPath("https://codymitch.works/?ref=LinkedIn"), "https://codymitch.works/ref/linkedin");
  assert.equal(withRefPath("https://codymitch.works/?ref=My%20CV!"), "https://codymitch.works/ref/my-cv");
});

test("a long source is cut to 32 characters", () => {
  const ref = withRefPath(`https://codymitch.works/?ref=${"a".repeat(50)}`);
  assert.equal(ref, `https://codymitch.works/ref/${"a".repeat(32)}`);
});

test("other query params drop with the move", () => {
  assert.equal(withRefPath("https://codymitch.works/?ref=email&trk=abc"), "https://codymitch.works/ref/email");
});

test("no ref, or an empty one, leaves the URL as it was", () => {
  assert.equal(withRefPath("https://codymitch.works/"), "https://codymitch.works/");
  assert.equal(withRefPath("https://codymitch.works/?trk=abc"), "https://codymitch.works/?trk=abc");
  assert.equal(withRefPath("https://codymitch.works/?ref="), "https://codymitch.works/?ref=");
  assert.equal(withRefPath("https://codymitch.works/?ref=!!!"), "https://codymitch.works/?ref=!!!");
});
