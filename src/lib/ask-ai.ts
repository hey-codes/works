import type { AskTool } from "./types.ts";

/** The link a tool opens: the prompt in its query, or the bare app for a copy tool. */
export function askHref(tool: AskTool, prompt: string): string {
  return tool.copy ? tool.url : tool.url + encodeURIComponent(prompt);
}

/** Where a click on a tool is counted in Web Analytics, as ?ref is: /ask/chatgpt. */
export function askPath(name: string): string {
  return `/ask/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
