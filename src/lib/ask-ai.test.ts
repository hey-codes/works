import assert from "node:assert/strict";
import { test } from "node:test";
import { RESUME_DATA } from "../data/resume-data.ts";
import { askHref, askPath } from "./ask-ai.ts";

const PROMPT = RESUME_DATA.footer.ask.prompt;

test("a prefill tool carries the whole prompt, encoded", () => {
  const base = "https://claude.ai/new?q=";
  const href = askHref({ name: "Claude", url: base }, PROMPT);
  assert.ok(href.startsWith(`${base}Read%20https%3A%2F%2Fcodymitch.works%2Fllms-full.txt`));
  assert.equal(decodeURIComponent(href.slice(base.length)), PROMPT);
});

test("a copy tool opens as it is, with no prompt in the link", () => {
  assert.equal(askHref({ name: "Gemini", url: "https://gemini.google.com/app", copy: true }, PROMPT), "https://gemini.google.com/app");
});

test("each tool is counted under /ask/<name>", () => {
  assert.equal(askPath("ChatGPT"), "/ask/chatgpt");
  assert.equal(askPath("Perplexity"), "/ask/perplexity");
});

test("Ask AI is paused, and the footer links llms.txt under FOR AI instead (Cody, 2026-10-29)", () => {
  assert.equal(RESUME_DATA.footer.ask.paused, true);
  assert.deepEqual(RESUME_DATA.footer.forAi, { key: "FOR AI", file: "llms.txt", note: "My profile for AI assistants" });
});
