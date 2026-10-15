/** What the reader is pointing at and what they have opened. */
export interface AtlasState {
  /** Role row under the pointer or focus. */
  hov: number | null;
  /** Open role rows, oldest first. The last one is the selected role. */
  openOrder: readonly number[];
  /** System being previewed (hover or focus). */
  sys: string | null;
  /** System pinned by click. */
  sysPin: string | null;
  /** "Show every site" was pressed: the map shows every brand though a row is open. The next job opened ends it. */
  allBrands: boolean;
}

export type AtlasAction =
  | { type: "hover"; role: number | null }
  | { type: "toggle"; role: number }
  | { type: "open"; role: number }
  | { type: "sysPreview"; name: string | null }
  | { type: "sysToggle"; name: string }
  | { type: "sysClear" }
  | { type: "showAll" };

export const initialAtlasState: AtlasState = { hov: null, openOrder: [], sys: null, sysPin: null, allBrands: false };

export function atlasReducer(s: AtlasState, a: AtlasAction): AtlasState {
  switch (a.type) {
    case "hover":
      return s.hov === a.role ? s : { ...s, hov: a.role };
    case "toggle": {
      const rest = s.openOrder.filter((r) => r !== a.role);
      const opening = rest.length === s.openOrder.length;
      // Opening a job shows its brand alone again; closing one leaves "every brand" as it was.
      return { ...s, allBrands: opening ? false : s.allBrands, openOrder: opening ? [...rest, a.role] : rest };
    }
    case "open":
      return { ...s, allBrands: false, openOrder: [...s.openOrder.filter((r) => r !== a.role), a.role] };
    case "sysPreview":
      return s.sys === a.name ? s : { ...s, sys: a.name };
    case "sysToggle":
      return { ...s, sysPin: s.sysPin === a.name ? null : a.name, sys: null };
    case "sysClear":
      return { ...s, sysPin: null, sys: null };
    case "showAll":
      return s.allBrands ? s : { ...s, allBrands: true };
  }
}

/** The role the map is framed on: the most recently opened row still open. */
export const selectedRole = (s: AtlasState): number | null => s.openOrder[s.openOrder.length - 1] ?? null;

/** What the map draws: roles tinted blue, the role kept lit, and the role the camera frames. */
export interface MapFocus {
  /** Roles whose sites are blue, ascending. */
  tint: readonly number[];
  /** Role the map shows alone: its sites and markets only. null shows every brand. */
  selected: number | null;
  /** Role the camera fits. null frames every site. */
  frame: number | null;
}

/**
 * What the map draws. Blue marks only what is pointed at or selected among the
 * rest: the hovered role, the open role once "Show every site" put every brand
 * back, or a traced system's roles. A brand shown alone is not tinted; showing
 * it alone is the signal. The narrow layout reads the list with the map off
 * screen, so nothing drives it.
 */
export function mapFocus(s: AtlasState, sysRoles: readonly number[] | null, narrow: boolean): MapFocus {
  if (narrow) return { tint: [], selected: null, frame: null };
  const selected = selectedRole(s);
  const shown = s.allBrands ? null : selected;
  if (sysRoles) return { tint: [...sysRoles].sort((a, b) => a - b), selected: null, frame: shown };
  const tint = [...new Set([s.hov, s.allBrands ? selected : null].filter((r): r is number => r !== null))].sort((a, b) => a - b);
  return { tint, selected: shown, frame: shown };
}

/**
 * The role rows lit in the list (blue edge and name): the hovered and the open
 * rows, or the rows a traced system touches. The list keeps this whether or
 * not the map tints the same role.
 */
export function litRoles(s: AtlasState, sysRoles: readonly number[] | null, narrow: boolean): readonly number[] {
  if (narrow) return [];
  if (sysRoles) return [...sysRoles].sort((a, b) => a - b);
  return [...new Set([s.hov, selectedRole(s)].filter((r): r is number => r !== null))].sort((a, b) => a - b);
}
