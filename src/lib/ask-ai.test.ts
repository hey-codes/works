import assert from "node:assert/strict";
import { test } from "node:test";
import { askHref, askPath } from "./ask-ai.ts";

const PROMPT =
  "Read https://codymitch.works/llms.txt. It's the career profile Cody Mitchell, a Chicago-based facilities manager, publishes for AI assistants, written and approved by him from his own resume and work records. First, tell me briefly where this information comes from and what it covers. Then ask what I'd like to know. Answer only from that file, and tell me when something isn't in it.";

test("a prefill tool carries the whole prompt, encoded", () => {
  const base = "https://claude.ai/new?q=";
  const href = askHref({ name: "Claude", url: base }, PROMPT);
  assert.ok(href.startsWith(`${base}Read%20https%3A%2F%2Fcodymitch.works%2Fllms.txt`));
  assert.equal(decodeURIComponent(href.slice(base.length)), PROMPT);
});

test("a copy tool opens as it is, with no prompt in the link", () => {
  assert.equal(askHref({ name: "Gemini", url: "https://gemini.google.com/app", copy: true }, PROMPT), "https://gemini.google.com/app");
});

test("each tool is counted under /ask/<name>", () => {
  assert.equal(askPath("ChatGPT"), "/ask/chatgpt");
  assert.equal(askPath("Perplexity"), "/ask/perplexity");
});
