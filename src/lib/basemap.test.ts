import assert from "node:assert/strict";
import { test } from "node:test";
import { cityLabelPlan, groundPaint, mixHex, regionLabelPlan } from "./basemap.ts";

const layers = [
  { id: "place_town", minzoom: 8 },
  { id: "place_state", minzoom: 5 },
  { id: "place_city_r6", minzoom: 8 },
  { id: "place_city_dot_r7", minzoom: 6 },
  { id: "place_city_dot_r4", minzoom: 5 },
  { id: "place_city_dot_r2", minzoom: 4 },
  { id: "place_city_dot_z7", minzoom: 7 },
  { id: "place_capital_dot_z7", minzoom: 7 },
  { id: "water_label", minzoom: 0 },
];

test("city names that only show inside the market band are hidden", () => {
  assert.deepEqual(cityLabelPlan(layers, 4.5).hide, ["place_city_dot_r7", "place_city_dot_r4", "place_city_dot_z7", "place_capital_dot_z7"]);
});

test("a city layer that starts below the band keeps its names until the band begins", () => {
  assert.deepEqual(cityLabelPlan(layers, 4.5).stopAt, [{ id: "place_city_dot_r2", minzoom: 4, maxzoom: 4.5 }]);
});

test("states, countries, towns and water are left alone", () => {
  const plan = cityLabelPlan(layers, 4.5);
  const touched = [...plan.hide, ...plan.stopAt.map((l) => l.id)];
  for (const id of ["place_town", "place_state", "place_city_r6", "water_label"]) assert.ok(!touched.includes(id), id);
});

const ground = { land: "#ffffff", soft: "#fbfaf9", edge: "#c9c8c3", line: "#e9e9e7", under: "#d3d1cb", ink: "#37352f", muted: "#6b6a63" };
const carto = (id: string, type: string) => ({ id, type });
const paintOf = (id: string, type: string) => Object.fromEntries(groundPaint([carto(id, type)], ground).map(([, prop, value]) => [prop, value]));

test("a hex color mixes toward another in sRGB, as color-mix does", () => {
  assert.equal(mixHex("#000000", "#ffffff", 0), "#000000");
  assert.equal(mixHex("#000000", "#ffffff", 1), "#ffffff");
  assert.equal(mixHex("#000000", "#ffffff", 0.5), "#808080");
  assert.equal(mixHex("#37352f", "#ffffff", 0.96), "#f7f7f7");
  // The built stylesheet writes #ffffff as #fff.
  assert.equal(mixHex("#fff", "#000", 0.5), "#808080");
});

test("the ground is the site's land, and the sea its map sea with a coastline in the edge color", () => {
  assert.deepEqual(paintOf("background", "background"), { "background-color": "#ffffff" });
  assert.deepEqual(paintOf("water", "fill"), { "fill-color": "#fbfaf9", "fill-outline-color": "#c9c8c3" });
  assert.deepEqual(paintOf("waterway", "line"), { "line-color": "#c9c8c3" });
});

test("land cover and parks flatten into the land; built-up areas take a trace of ink", () => {
  for (const id of ["landcover", "park_national_park", "park_nature_reserve", "landuse"]) assert.deepEqual(paintOf(id, "fill"), { "fill-color": "#ffffff" }, id);
  assert.deepEqual(paintOf("landuse_residential", "fill"), { "fill-color": mixHex("#ffffff", "#37352f", 0.04) });
  assert.deepEqual(paintOf("building", "fill"), { "fill-color": mixHex("#ffffff", "#37352f", 0.06) });
});

test("borders are grey, never CARTO's pink, which read like a pre-opening dashed ring", () => {
  assert.deepEqual(paintOf("boundary_country_inner", "line"), { "line-color": "#c9c8c3" });
  assert.deepEqual(paintOf("boundary_country_outline", "line"), { "line-color": "#c9c8c3" });
  assert.deepEqual(paintOf("boundary_state", "line"), { "line-color": "#d3d1cb" });
  assert.deepEqual(paintOf("boundary_county", "line"), { "line-color": "#e9e9e7" });
});

test("roads are outlined in the hairline greys and filled with the land", () => {
  for (const id of ["road_mot_case_noramp", "road_trunk_case_ramp", "road_pri_case_noramp", "bridge_mot_case", "tunnel_pri_case"]) assert.deepEqual(paintOf(id, "line"), { "line-color": "#d3d1cb" }, id);
  for (const id of ["road_minor_case", "road_service_case", "bridge_sec_case", "tunnel_minor_case", "road_path", "rail", "tunnel_rail", "aeroway-runway"]) assert.deepEqual(paintOf(id, "line"), { "line-color": "#e9e9e7" }, id);
  for (const id of ["road_mot_fill_noramp", "road_minor_fill", "bridge_pri_fill", "tunnel_sec_fill", "rail_dash", "tunnel_rail_dash"]) assert.deepEqual(paintOf(id, "line"), { "line-color": "#ffffff" }, id);
});

test("CARTO's names are a step quieter than the map's own market names, on a halo of the land", () => {
  const quiet = mixHex("#6b6a63", "#ffffff", 0.3);
  for (const id of ["place_country_1", "place_state", "place_town", "place_city_r6", "roadname_major", "poi_park"]) {
    assert.deepEqual(paintOf(id, "symbol"), { "text-color": quiet, "text-halo-color": "#ffffff", "icon-color": quiet }, id);
  }
  // Names on the water sit on the sea; a river's name sits on the land beside it.
  for (const id of ["watername_ocean", "watername_lake"]) assert.deepEqual(paintOf(id, "symbol"), { "text-color": quiet, "text-halo-color": "#fbfaf9", "icon-color": quiet }, id);
  assert.deepEqual(paintOf("waterway_label", "symbol"), { "text-color": quiet, "text-halo-color": "#ffffff", "icon-color": quiet });
});

test("the map's own layers, and anything CARTO adds later, are left alone", () => {
  for (const id of ["market-circles", "market-names", "site-dots", "site-names", "spot-labels", "something_new"]) {
    assert.deepEqual(groundPaint([carto(id, "symbol")], ground), [], id);
  }
  // CARTO's hidden house numbers stay hidden.
  assert.deepEqual(groundPaint([carto("housenumber", "symbol")], ground), []);
  assert.deepEqual(groundPaint([carto("water_shadow", "fill")], ground), []);
});

test("country, state and continent names wait for city zoom, where the market circles and their names have gone", () => {
  const plan = regionLabelPlan(
    [
      { id: "place_country_1", minzoom: 2, maxzoom: 7 },
      { id: "place_country_2", minzoom: 3, maxzoom: 10 },
      { id: "place_state", minzoom: 5, maxzoom: 10 },
      { id: "place_continent", minzoom: 0, maxzoom: 2 },
      { id: "place_town", minzoom: 8, maxzoom: 14 },
      { id: "watername_ocean", minzoom: 0, maxzoom: 5 },
    ],
    9,
  );
  // A layer that ends by city zoom never shows; one that runs past it starts there.
  assert.deepEqual(plan.hide, ["place_country_1", "place_continent"]);
  assert.deepEqual(plan.startAt, [
    { id: "place_country_2", minzoom: 9, maxzoom: 10 },
    { id: "place_state", minzoom: 9, maxzoom: 10 },
  ]);
});
