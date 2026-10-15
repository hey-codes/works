"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useState } from "react";
import { RESUME_DATA } from "@/data/resume-data";
import { type AtlasState, atlasReducer, initialAtlasState, litRoles, type MapFocus, mapFocus, selectedRole } from "@/lib/atlas-reducer";
import { systemRoles } from "@/lib/format";
import { NARROW_QUERY, scrollToElement, useMediaQuery } from "@/lib/use-media-query";

interface Atlas extends Pick<AtlasState, "hov" | "sysPin"> {
  /** Under 960px the map sits under the hero and the list does not drive it. */
  narrow: boolean;
  /** Open role rows, by index. */
  open: Readonly<Record<number, boolean>>;
  /** The role the map is framed on: the most recently opened row still open. */
  selected: number | null;
  /** System being traced, preview first, then the pin. */
  sysActive: string | null;
  /** Roles that used the traced system. */
  sysRoles: ReadonlySet<number> | null;
  /** What the map draws. */
  focus: MapFocus;
  /** Role rows lit in the list: hovered and open, or a trace. Independent of the map's tint. */
  lit: readonly number[];
  hover: (role: number | null) => void;
  toggle: (role: number) => void;
  /** Opens a role and scrolls the list to it (a site card's "Role"). */
  openRoleAndScroll: (role: number) => void;
  /** Opens a role without scrolling, so the map shows that brand (a site card's "All N sites"). */
  openRoleInPlace: (role: number) => void;
  /** Puts every brand back on the map; open rows stay open ("Show every site"). */
  showAll: () => void;
  sysPreview: (name: string | null) => void;
  sysToggle: (name: string) => void;
  sysClear: () => void;
  /** The last site asked for from outside the map (a caption tier chip), which the map flies to and opens. */
  siteAsk: SiteAsk | null;
  /**
   * Asks the map for a site's card; `from` takes focus back when the card
   * closes, and `focusCard` says whether focus goes into the card on open.
   */
  askSite: (id: number, from: HTMLElement | null, focusCard: boolean) => void;
}

/** A site asked for from outside the map. Numbered, so asking for the same site again asks again. */
export interface SiteAsk {
  id: number;
  n: number;
  from: HTMLElement | null;
  /** Focus goes into the card when it opens; a tier chip keeps it, so the reader can press again. */
  focusCard: boolean;
}

const AtlasContext = createContext<Atlas | null>(null);

export function AtlasProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(atlasReducer, initialAtlasState);
  const narrow = useMediaQuery(NARROW_QUERY);
  const [siteAsk, setSiteAsk] = useState<SiteAsk | null>(null);
  const askSite = useCallback((id: number, from: HTMLElement | null, focusCard: boolean) => setSiteAsk((a) => ({ id, n: (a?.n ?? 0) + 1, from, focusCard })), []);

  const actions = useMemo(
    () => ({
      hover: (role: number | null) => dispatch({ type: "hover", role }),
      toggle: (role: number) => dispatch({ type: "toggle", role }),
      openRoleAndScroll: (role: number) => {
        dispatch({ type: "open", role });
        const el = document.getElementById(`role-row-${role}`);
        if (el) scrollToElement(el);
      },
      openRoleInPlace: (role: number) => dispatch({ type: "open", role }),
      showAll: () => dispatch({ type: "showAll" }),
      sysPreview: (name: string | null) => dispatch({ type: "sysPreview", name }),
      sysToggle: (name: string) => dispatch({ type: "sysToggle", name }),
      sysClear: () => dispatch({ type: "sysClear" }),
    }),
    [],
  );

  const value = useMemo<Atlas>(() => {
    const sysActive = narrow ? null : (state.sys ?? state.sysPin);
    const traced = sysActive ? systemRoles(RESUME_DATA, sysActive) : null;
    return {
      hov: state.hov,
      sysPin: state.sysPin,
      ...actions,
      narrow,
      open: Object.fromEntries(state.openOrder.map((r) => [r, true])),
      selected: selectedRole(state),
      sysActive,
      sysRoles: traced ? new Set(traced) : null,
      focus: mapFocus(state, traced, narrow),
      lit: litRoles(state, traced, narrow),
      siteAsk,
      askSite,
    };
  }, [state, actions, narrow, siteAsk, askSite]);

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

export function useAtlas(): Atlas {
  const atlas = useContext(AtlasContext);
  if (!atlas) throw new Error("useAtlas must be used inside AtlasProvider");
  return atlas;
}

/** Shared handlers for anything that traces a system: role chips and STACK rows. */
export function useSystemTrace(name: string) {
  const { sysPin, sysPreview, sysToggle } = useAtlas();
  return {
    pinned: sysPin === name,
    handlers: {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        sysToggle(name);
      },
      // Hover previews for a pointer that hovers; a tap's mouseenter would
      // leave a preview that nothing clears.
      onPointerEnter: (e: React.PointerEvent) => e.pointerType !== "touch" && sysPreview(name),
      onPointerLeave: (e: React.PointerEvent) => e.pointerType !== "touch" && sysPreview(null),
      onFocus: () => sysPreview(name),
      onBlur: () => sysPreview(null),
    },
  };
}
