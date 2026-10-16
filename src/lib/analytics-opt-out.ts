// Cody's own visits stay out of the traffic numbers: codymitch.works/?notrack
// opts a browser out, ?track opts it back in. The choice is kept in
// localStorage under this key, beside the theme.
export const OPT_OUT_KEY = "atlas-notrack";

/** true to opt out, false to opt back in, null when the URL says neither. */
export function optOutChoice(search: string): boolean | null {
  const params = new URLSearchParams(search);
  if (params.has("notrack")) return true;
  if (params.has("track")) return false;
  return null;
}
