import type * as MapLibreGL from "maplibre-gl";
import { MARK_ICON, NOTCH_ICON } from "@/lib/cluster-style";

/** Icons are drawn at twice their size on screen, so they stay crisp on dense displays. */
const SIZE = 32;
const RATIO = 2;

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
 * The project mark, in the theme's red: a filled diamond, on a site and, on a
 * backing in the ground, as a circle's notch. Added again after every style
 * load, since a style change drops it; the color is the new theme's.
 */
export function addMarkIcons(map: MapLibreGL.Map, { red, bg }: { red: string; bg: string }) {
  const fillDiamond = (ctx: CanvasRenderingContext2D) => {
    diamond(ctx);
    ctx.fillStyle = red;
    ctx.fill();
  };
  const icons: [string, ImageData][] = [
    [MARK_ICON, draw(fillDiamond)],
    [
      NOTCH_ICON,
      draw((ctx) => {
        backing(ctx, bg);
        fillDiamond(ctx);
      }),
    ],
  ];
  for (const [name, image] of icons) {
    if (map.hasImage(name)) map.removeImage(name);
    map.addImage(name, image, { pixelRatio: RATIO });
  }
}
