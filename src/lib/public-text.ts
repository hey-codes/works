// What a public text file (llms.txt, changelog.md) must never carry. The
// banned brand and people's names are not listed here: this file is pushed,
// and job-hunt's rule keeps those names out of every file (Cody, 2026-10-29).
const RULES: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, "email address"],
  [/\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/, "phone number"],
  [/\b\d+\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive)\b/, "street address"],
  [/Montrose/, "Montrose"],
  [new RegExp(String.fromCharCode(0x2014)), "em dash"],
  [new RegExp(String.fromCharCode(0x2013)), "en dash"],
];

/** One message per rule the text breaks; empty when clean. Dollars only where not allowed. */
export function publicTextProblems(text: string, opts: { dollars: boolean }): string[] {
  const rules = opts.dollars ? RULES : [...RULES, [/\$/, "dollar figure"] as [RegExp, string]];
  return rules.filter(([re]) => re.test(text)).map(([, name]) => `${name} found`);
}
