import type { SiteProps } from "./site-points.ts";

/** A chip on a site card: what it says (copy in RESUME_DATA.map.card.chips), its tone, and a year where one goes with it. */
export interface CardChip {
  key: "flagship" | "office" | "flexOffice" | "newLocation" | "closed";
  tone: "ink" | "red" | "muted";
  year: number | null;
}

type ChipSource = Pick<SiteProps, "name" | "type" | "opening" | "closed" | "closedYear">;

/** Types a chip says better than the TYPE row. */
const TYPE_CHIPS: Record<string, CardChip["key"]> = { Flagship: "flagship", Office: "office", "Flex office": "flexOffice" };

/**
 * A site card's chips, in order (Cody, 2026-10-15): what kind of site it is
 * where that stands out (FLAGSHIP, OFFICE, FLEX OFFICE, in ink); NEW LOCATION
 * in red on the openings he led or is leading (opened, pre-opening, in
 * progress; a supported opening is not his new location); CLOSED last,
 * muted, with its year where the records hold one.
 */
export function cardChips(site: ChipSource): CardChip[] {
  const chips: CardChip[] = [];
  const kind = Object.hasOwn(TYPE_CHIPS, site.type) ? TYPE_CHIPS[site.type] : undefined;
  if (kind) chips.push({ key: kind, tone: "ink", year: null });
  if (site.opening === "opened" || site.opening === "pre-opening" || site.opening === "in-progress") chips.push({ key: "newLocation", tone: "red", year: null });
  if (site.closed) chips.push({ key: "closed", tone: "muted", year: site.closedYear });
  return chips;
}

/** Whether the card's TYPE row says anything a chip or the name does not. */
export const showsType = (site: Pick<SiteProps, "name" | "type">) => !Object.hasOwn(TYPE_CHIPS, site.type) && site.type !== site.name;
