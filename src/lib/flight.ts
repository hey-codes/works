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
