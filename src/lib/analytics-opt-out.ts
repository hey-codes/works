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

type OptOutStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Whether this browser is opted out, recording a choice the URL makes. Read on
 * every event, so the visit that carries ?notrack is itself not counted.
 * Without storage, or storage that throws (a private window), only the URL decides.
 */
export function optedOut(search: string, storage: OptOutStorage | null): boolean {
  const choice = optOutChoice(search);
  try {
    if (choice === true) storage?.setItem(OPT_OUT_KEY, "1");
    else if (choice === false) storage?.removeItem(OPT_OUT_KEY);
    else return storage?.getItem(OPT_OUT_KEY) === "1";
  } catch {}
  return choice === true;
}
