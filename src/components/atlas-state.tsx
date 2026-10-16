"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { RESUME_DATA } from "@/data/resume-data";
import { atlasReducer, initialAtlasState, type MapFocus, mapFocus, type Pick, pickRoles, samePick, selectedRole, shownPick } from "@/lib/atlas-reducer";
import { systemRoles } from "@/lib/format";
import { NARROW_QUERY, scrollToElement, useMediaQuery } from "@/lib/use-media-query";

const rolesOf = (system: string) => systemRoles(RESUME_DATA, system);

interface Atlas {
  /** Under 960px the map sits under the hero and the list does not drive it. */
  narrow: boolean;
  /** Open role records, by index. */
  open: Readonly<Record<number, boolean>>;
  /** The locked pick, and what the map shows now (the hover's preview, else the pick). */
  pick: Pick | null;
  shown: Pick | null;
  /** The picked role, null when the pick is a system or there is none. */
  selected: number | null;
  /** The system the map shows now, previewed or picked, and the roles that used it. */
  sysActive: string | null;
  sysRoles: ReadonlySet<number> | null;
  /** What the map draws and frames. */
  focus: MapFocus;
  /** Preview a pick (hover or focus), or end the preview. */
  hover: (pick: Pick | null) => void;
  /** A role row's click or toggle: from 960px it opens the record and picks the role, or closes and clears it. */
  toggle: (role: number) => void;
  /** Opens a role, picks it and scrolls the list to it (a site card's "Role"). */
  openRoleAndScroll: (role: number) => void;
  /** Opens and picks a role without scrolling (a site card's "All N sites"). */
  openRoleInPlace: (role: number) => void;
  /** A CMMS name or a STACK row: pick it, or clear it when it is already the pick. */
  pickSys: (name: string) => void;
  /** Esc and "Show every site": no pick, every site. */
  clear: () => void;
}

const AtlasContext = createContext<Atlas | null>(null);

export function AtlasProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(atlasReducer, initialAtlasState);
  const narrow = useMediaQuery(NARROW_QUERY);

  const actions = useMemo(
    () => ({
      hover: (pick: Pick | null) => dispatch({ type: "hover", pick }),
      clear: () => dispatch({ type: "clear" }),
      pickSys: (name: string) => dispatch({ type: "pickSys", name }),
    }),
    [],
  );

  // Esc clears the pick, from 960px, unless a site card is open: Esc closes
  // the card first, and the next one clears.
  useEffect(() => {
    if (narrow || state.pick === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector(".maplibregl-popup")) return;
      dispatch({ type: "clear" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [narrow, state.pick]);

  const value = useMemo<Atlas>(() => {
    const shown = narrow ? null : shownPick(state);
    const sysActive = shown?.kind === "sys" ? shown.name : null;
    const traced = sysActive ? pickRoles(shown, rolesOf) : null;
    const single = !narrow;
    return {
      ...actions,
      narrow,
      open: Object.fromEntries(state.open.map((r) => [r, true])),
      pick: narrow ? null : state.pick,
      shown,
      selected: narrow ? null : selectedRole(state),
      sysActive,
      sysRoles: traced ? new Set(traced) : null,
      focus: mapFocus(state, rolesOf, narrow),
      toggle: (role: number) => dispatch({ type: "toggle", role, single }),
      openRoleAndScroll: (role: number) => {
        dispatch({ type: "pickRole", role, single });
        const el = document.getElementById(`role-row-${role}`);
        if (el) scrollToElement(el);
      },
      openRoleInPlace: (role: number) => dispatch({ type: "pickRole", role, single }),
    };
  }, [state, actions, narrow]);

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

export function useAtlas(): Atlas {
  const atlas = useContext(AtlasContext);
  if (!atlas) throw new Error("useAtlas must be used inside AtlasProvider");
  return atlas;
}

/**
 * Shared handlers for anything that picks a system: CMMS names and STACK rows.
 * Hover and focus preview it; a click picks it, or clears it when it is the pick.
 */
export function useSystemTrace(name: string) {
  const { pick, hover, pickSys } = useAtlas();
  const self: Pick = { kind: "sys", name };
  return {
    pinned: samePick(pick, self),
    handlers: {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        pickSys(name);
      },
      // A pointer that hovers previews; a tap's mouseenter would leave a preview nothing clears.
      onPointerEnter: (e: React.PointerEvent) => e.pointerType !== "touch" && hover(self),
      onPointerLeave: (e: React.PointerEvent) => e.pointerType !== "touch" && hover(null),
      onFocus: () => hover(self),
      onBlur: () => hover(null),
    },
  };
}
