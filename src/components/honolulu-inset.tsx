"use client";

import * as MapLibreGL from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "@/components/ui/map";
import { groundPaint } from "@/lib/basemap";
import { MARK_ICON } from "@/lib/cluster-style";
import { siteWord } from "@/lib/format";
import { FIT_MAX_ZOOM } from "@/lib/map-config";
import { HAS_OPENING } from "@/lib/map-filters";
import { boundsOfCoords, farSites, type SitePoints } from "@/lib/site-points";
import { GUARD_ATTR } from "./edge-guards";
import { flyToBounds } from "./map-flight";
import { addMarkIcons } from "./mark-icons";
import { readGround, readPalette } from "./site-clusters";

const SOURCE = "inset-sites";

/** Draws `far` in the inset and frames them. */
function place(map: MapLibreGL.Map, far: SitePoints["features"], bounds: [[number, number], [number, number]] | null) {
  (map.getSource(SOURCE) as MapLibreGL.GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: far });
  if (bounds) map.fitBounds(bounds, { padding: 14, maxZoom: 8, duration: 0 });
}

/**
 * Honolulu, inset in the map's bottom-left corner (Cody, 2026-10-15): a small
 * live map of the sites the main map shows there, which no fit of the mainland
 * takes in. It follows what is shown (a pick that has none there hides it, as
 * does a main view that already has them in it) and a click flies the main map
 * to them. Its ground is CARTO's, recolored like the main map's, with no names;
 * plain sites are ink dots and projects the red diamond.
 */
export function HonoluluInset({ points, ground, blank }: { points: SitePoints; ground: { light: string; dark: string }; blank: boolean }) {
  const { map: main, resolvedTheme } = useMap();
  const box = useRef<HTMLDivElement>(null);
  const inset = useRef<MapLibreGL.Map | null>(null);
  const far = useMemo(() => farSites(points), [points]);
  const bounds = useMemo(() => boundsOfCoords(far.map((f) => f.geometry.coordinates)), [far]);
  const [first] = far;
  // The latest sites and frame, which a style load (the first, or a theme change) applies.
  const latest = useRef({ far, bounds });
  latest.current = { far, bounds };
  // Hidden while the main view already holds them, as the old caption link was.
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!main || !bounds) return;
    const check = () => setInView(far.some((f) => main.getBounds().contains(f.geometry.coordinates as [number, number])));
    check();
    main.on("moveend", check);
    return () => {
      main.off("moveend", check);
    };
  }, [main, bounds, far]);

  const shown = !blank && first !== undefined && bounds !== null && !inView;

  // The inset map: created once its box is on the page, and its ground styled
  // for the theme, again after a theme change.
  useEffect(() => {
    if (!shown || !box.current) return;
    const map = new MapLibreGL.Map({
      container: box.current,
      style: ground[resolvedTheme],
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      bounds: bounds ?? undefined,
      fitBoundsOptions: { padding: 14, maxZoom: 8 },
    });
    inset.current = map;
    const dress = () => {
      for (const layer of map.getStyle().layers ?? []) if (layer.type === "symbol") map.setLayoutProperty(layer.id, "visibility", "none");
      for (const [id, property, value] of groundPaint(map.getStyle().layers ?? [], readGround())) map.setPaintProperty(id, property as never, value as never);
      const palette = readPalette();
      addMarkIcons(map, palette);
      map.addSource(SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: `${SOURCE}-dots`, type: "circle", source: SOURCE, filter: ["!", HAS_OPENING] as never, paint: { "circle-radius": 3, "circle-color": palette.ink, "circle-stroke-width": 1, "circle-stroke-color": palette.bg } });
      map.addLayer({ id: `${SOURCE}-marks`, type: "symbol", source: SOURCE, filter: HAS_OPENING as never, layout: { "icon-image": MARK_ICON, "icon-allow-overlap": true, "icon-size": 0.8 } });
      place(map, latest.current.far, latest.current.bounds);
    };
    map.on("style.load", dress);
    return () => {
      map.remove();
      inset.current = null;
    };
    // Built once per showing and theme (its frame read at that moment); the
    // sites and the frame follow below.
  }, [shown, resolvedTheme]);

  // The sites the main map shows there, and a frame around them; before the
  // style has loaded, its load applies them.
  useEffect(() => {
    const map = inset.current;
    if (map?.getSource(SOURCE)) place(map, far, bounds);
  }, [far, bounds]);

  if (!shown || !first || !bounds) return null;
  const label = `${first.properties.city} · ${far.length} ${siteWord(far.length)}`;
  return (
    <button
      type="button"
      {...{ [GUARD_ATTR]: "" }}
      aria-label={label}
      title={label}
      onClick={() => {
        if (!main) return;
        main.getCanvas().focus({ preventScroll: true });
        flyToBounds(main, bounds, FIT_MAX_ZOOM);
      }}
      className="border-border bg-background absolute bottom-2 left-2 z-10 flex h-[88px] w-32 cursor-pointer flex-col overflow-hidden rounded-[4px] border p-0 text-left max-[959.98px]:h-[72px] max-[959.98px]:w-[104px]"
    >
      <div ref={box} className="min-h-0 w-full flex-1" />
      <span className="text-muted-foreground border-border border-t px-1.5 py-1 font-mono text-[11px] leading-none">
        {first.properties.city} · {far.length}
      </span>
    </button>
  );
}
