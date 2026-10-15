import { FLIGHT } from "./map-config.ts";

/**
 * How long a camera flight takes, from how far it zooms: longer journeys take
 * longer, within bounds, and a flight back out runs a little quicker than the
 * flight in.
 */
export function flightMs(fromZoom: number, toZoom: number): number {
  const ms = Math.min(FLIGHT.maxMs, FLIGHT.minMs + FLIGHT.msPerZoom * Math.abs(toZoom - fromZoom));
  return Math.round(toZoom < fromZoom ? ms * FLIGHT.outFactor : ms);
}

/**
 * Whether "Show every site" moves the camera (Cody, 2026-10-15). With a brand
 * shown alone or a market open, it puts every brand back where the reader is
 * looking; with every brand already shown (a system trace shows them all, even
 * with a role framed) and nothing open, it flies out to the opening view.
 */
export const showEverySiteFlies = (brandAlone: boolean, marketOpen: boolean): boolean => !brandAlone && !marketOpen;
