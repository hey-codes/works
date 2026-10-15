/** How the map groups sites and moves. One place, so the click-budget test measures what ships. */

/**
 * Markets merge into region circles only at the opening zoom: from zoom 3 on,
 * every market is its own circle. With a region click fitting its markets and a
 * market click showing that market's own sites, any city is two clicks from the
 * opening view and any site's card three (see click-budget.test.ts).
 */
export const MARKET_CLUSTER_RADIUS = 40;
export const MARKET_CLUSTER_MAX_ZOOM = 2;
/** From this zoom every site in view is drawn and the market circles step out. */
export const CITY_ZOOM = 9;
/** A region or market flight never lands closer than this. */
export const FIT_MAX_ZOOM = 13;
/** An open role's flight stops here: one site, or one tight group, lands at city level. */
export const ROLE_FIT_MAX_ZOOM = 11;
/** Space kept between a fit and the frame's edge, in px, on a side with no control (see framePadding in framing.ts). */
export const FRAME_PADDING = 48;
export const MAP_MIN_ZOOM = 2;
export const MAP_MAX_ZOOM = 16;
/**
 * Camera flights: time grows with the zoom travelled, within bounds, and a
 * flight back out runs a little quicker than the flight in. `curve` is
 * MapLibre's arc (its default).
 */
export const FLIGHT = { minMs: 900, msPerZoom: 150, maxMs: 2500, outFactor: 0.8, curve: 1.42 };
