import type * as MapLibreGL from "maplibre-gl";
import { MARK_ICONS, NOTCH_ICONS } from "@/lib/cluster-style";

/** Icons are drawn at twice their size on screen, so they stay crisp on dense displays. */
const SIZE = 32;
const RATIO = 2;
const RING = 10;
/**
 * The dashed ring's circumference in six equal steps, each a dash and a gap,
 * so no short dash is left where the ring closes.
 */
const DASH_STEP = (2 * Math.PI * RING) / 6;

function draw(paint: (ctx: CanvasRenderingContext2D) => void): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(SIZE, SIZE);
  paint(ctx);
  return ctx.getImageData(0, 0, SIZE, SIZE);
}

/** The diamond's outline, a point at each edge's middle, 3px in. */
function diamond(ctx: CanvasRenderingContext2D) {
  const c = SIZE / 2;
  ctx.beginPath();
  ctx.moveTo(c, 3);
  ctx.lineTo(SIZE - 3, c);
  ctx.lineTo(c, SIZE - 3);
  ctx.lineTo(3, c);
  ctx.closePath();
}

function ring(ctx: CanvasRenderingContext2D, dashed: boolean) {
  const c = SIZE / 2;
  ctx.beginPath();
  ctx.setLineDash(dashed ? [DASH_STEP * 0.6, DASH_STEP * 0.4] : []);
  ctx.arc(c, c, RING, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.stroke();
}

/**
 * A notch's backing: a disc of the ground, a little wider than the shape, so
 * the red reads against the ink circle it sits on as well as the land.
 */
function backing(ctx: CanvasRenderingContext2D, bg: string) {
  const c = SIZE / 2;
  ctx.beginPath();
  ctx.arc(c, c, SIZE / 2, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
}

/**
 * The three opening marks, in the theme's red: a filled diamond (opened), a
 * ring (supported) and a dashed ring (pre-opening, in progress). Shape carries
 * the tier, so color is never the only code. The circles' notches are the
 * same shapes on a backing in the ground. Added again after every style
 * load, since a style change drops them; the colors are the new theme's.
 */
export function addMarkIcons(map: MapLibreGL.Map, { red, bg }: { red: string; bg: string }) {
  const fillDiamond = (ctx: CanvasRenderingContext2D) => {
    diamond(ctx);
    ctx.fillStyle = red;
    ctx.fill();
  };
  const strokeRing = (dashed: boolean) => (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = red;
    ring(ctx, dashed);
  };
  const onBacking = (paint: (ctx: CanvasRenderingContext2D) => void) => (ctx: CanvasRenderingContext2D) => {
    backing(ctx, bg);
    paint(ctx);
  };
  const icons: [string, ImageData][] = [
    [MARK_ICONS.opened, draw(fillDiamond)],
    [MARK_ICONS.supported, draw(strokeRing(false))],
    [MARK_ICONS.dashed, draw(strokeRing(true))],
    [NOTCH_ICONS.opened, draw(onBacking(fillDiamond))],
    [NOTCH_ICONS.supported, draw(onBacking(strokeRing(false)))],
    [NOTCH_ICONS.dashed, draw(onBacking(strokeRing(true)))],
  ];
  for (const [name, image] of icons) {
    if (map.hasImage(name)) map.removeImage(name);
    map.addImage(name, image, { pixelRatio: RATIO });
  }
}
