/**
 * What the map can be asked to show: one role, or a system (a CMMS or an app
 * from STACK), which stands for every role that used it.
 */
export type Pick = { kind: "role"; role: number } | { kind: "sys"; name: string };

/**
 * What the reader is pointing at and what they have picked (Cody, 2026-10-15):
 * one pick at a time. Hovering or focusing a role, a CMMS name or a STACK row
 * previews it on the map; a click locks it in; clicking it again, Esc or "Show
 * every site" clears it.
 */
export interface AtlasState {
  /** Under the pointer or focus: the map shows it in place while it is there. */
  hov: Pick | null;
  /** Clicked: the map shows and frames it until it is cleared. */
  pick: Pick | null;
  /**
   * Open role records. From 960px a record is open only while its role is the
   * pick; under 960px, where the list does not drive the map, records open and
   * close on their own (`single: false`).
   */
  open: readonly number[];
}

export type AtlasAction =
  | { type: "hover"; pick: Pick | null }
  /** A role row's click or its toggle. `single` from 960px: the record is the pick. */
  | { type: "toggle"; role: number; single: boolean }
  /** A site card's "Role" or "All N sites": open the role and pick it, never close it. */
  | { type: "pickRole"; role: number; single: boolean }
  /** A CMMS name or a STACK row: pick it, or clear it when it is already the pick. */
  | { type: "pickSys"; name: string }
  /** Esc or "Show every site". */
  | { type: "clear" };

export const initialAtlasState: AtlasState = { hov: null, pick: null, open: [] };

export const samePick = (a: Pick | null, b: Pick | null): boolean =>
  a === b || (a !== null && b !== null && (a.kind === "role" ? b.kind === "role" && a.role === b.role : b.kind === "sys" && a.name === b.name));

const pickedRole = (s: AtlasState): number | null => (s.pick?.kind === "role" ? s.pick.role : null);

/** The picked role's record closes with its pick; any other record stays as it was. */
const withoutPicked = (s: AtlasState): readonly number[] => {
  const role = pickedRole(s);
  return role === null ? s.open : s.open.filter((r) => r !== role);
};

/**
 * A click ends the hover's preview (`hov: null`), so what the click did shows at
 * once, and clearing a pick under the pointer does not leave it previewed.
 */
export function atlasReducer(s: AtlasState, a: AtlasAction): AtlasState {
  switch (a.type) {
    case "hover":
      return samePick(s.hov, a.pick) ? s : { ...s, hov: a.pick };
    case "toggle": {
      const isOpen = s.open.includes(a.role);
      if (!a.single) return { ...s, open: isOpen ? s.open.filter((r) => r !== a.role) : [...s.open, a.role] };
      if (isOpen) return { hov: null, pick: pickedRole(s) === a.role ? null : s.pick, open: s.open.filter((r) => r !== a.role) };
      return { hov: null, pick: { kind: "role", role: a.role }, open: [a.role] };
    }
    case "pickRole":
      if (!a.single) return s.open.includes(a.role) ? s : { ...s, open: [...s.open, a.role] };
      return { hov: null, pick: { kind: "role", role: a.role }, open: [a.role] };
    case "pickSys": {
      const pick: Pick = { kind: "sys", name: a.name };
      if (samePick(s.pick, pick)) return { hov: null, pick: null, open: s.open };
      return { hov: null, pick, open: withoutPicked(s) };
    }
    case "clear":
      return s.pick === null && s.hov === null ? s : { hov: null, pick: null, open: withoutPicked(s) };
  }
}

/** The role picked, or null when the pick is a system or there is none. */
export const selectedRole = pickedRole;

/** What the map shows now: the hover's preview, else the pick. */
export const shownPick = (s: AtlasState): Pick | null => s.hov ?? s.pick;

/** The roles a pick stands for, ascending: its role, or every role its system was used at. null for no pick. */
export function pickRoles(pick: Pick | null, rolesOf: (system: string) => readonly number[]): readonly number[] | null {
  if (pick === null) return null;
  return pick.kind === "role" ? [pick.role] : [...rolesOf(pick.name)].sort((a, b) => a - b);
}

/** What the map draws and frames. */
export interface MapFocus {
  /** The roles whose sites alone the map draws, with their own counts. null draws every site. */
  shown: readonly number[] | null;
  /** The roles the camera fits: the pick's, never a hover's. null frames every site. */
  frame: readonly number[] | null;
}

/**
 * What the map draws: only the shown pick's sites, the camera framed on the
 * locked pick. A hover filters in place and never moves the camera. Under
 * 960px the list does not drive the map, so it shows every site.
 */
export function mapFocus(s: AtlasState, rolesOf: (system: string) => readonly number[], narrow: boolean): MapFocus {
  if (narrow) return { shown: null, frame: null };
  return { shown: pickRoles(shownPick(s), rolesOf), frame: pickRoles(s.pick, rolesOf) };
}
