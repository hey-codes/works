import styles from "./atlas.module.css";

// Three loose fineliner strokes, each a filled ribbon in a 200 by 8 box: a
// slow wobble, a blunt start, about 1.8px at its thickest, tapering to a hair
// as it lifts at the end. Filled rather than stroked, so stretching the box to
// a word's width (preserveAspectRatio none) moves the wobble along the word but
// never changes the line's weight, which is set by the box's fixed 8px height.
const STROKES = [
  "M1.0 4.05 7.6 4.02 14.2 3.97 20.8 3.91 27.4 3.86 34.0 3.85 40.6 3.82 47.2 3.77 53.8 3.70 60.4 3.62 67.0 3.52 73.6 3.41 80.2 3.30 86.8 3.17 93.4 3.05 100.0 2.93 106.6 2.82 113.2 2.71 119.8 2.62 126.4 2.55 133.0 2.52 139.6 2.52 146.2 2.54 152.8 2.60 159.4 2.68 166.0 2.78 172.6 2.82 179.2 2.80 185.8 2.70 192.4 2.53 199.0 2.27 199.0 2.52 192.4 2.98 185.8 3.34 179.2 3.62 172.6 3.81 166.0 3.92 159.4 3.97 152.8 4.02 146.2 4.08 139.6 4.15 133.0 4.23 126.4 4.32 119.8 4.42 113.2 4.51 106.6 4.62 100.0 4.73 93.4 4.85 86.8 4.97 80.2 5.10 73.6 5.21 67.0 5.32 60.4 5.42 53.8 5.50 47.2 5.57 40.6 5.62 34.0 5.65 27.4 5.66 20.8 5.60 14.2 5.48 7.6 5.35 1.0 5.20Z",
  "M1.0 3.09 7.6 2.90 14.2 2.73 20.8 2.59 27.4 2.51 34.0 2.52 40.6 2.56 47.2 2.63 53.8 2.73 60.4 2.85 67.0 2.99 73.6 3.12 80.2 3.25 86.8 3.37 93.4 3.46 100.0 3.53 106.6 3.56 113.2 3.56 119.8 3.53 126.4 3.49 133.0 3.44 139.6 3.38 146.2 3.32 152.8 3.27 159.4 3.23 166.0 3.22 172.6 3.18 179.2 3.11 185.8 3.01 192.4 2.88 199.0 2.71 199.0 2.96 192.4 3.33 185.8 3.65 179.2 3.93 172.6 4.17 166.0 4.37 159.4 4.52 152.8 4.69 146.2 4.85 139.6 5.01 133.0 5.15 126.4 5.26 119.8 5.33 113.2 5.36 106.6 5.36 100.0 5.33 93.4 5.26 86.8 5.17 80.2 5.05 73.6 4.92 67.0 4.79 60.4 4.65 53.8 4.53 47.2 4.43 40.6 4.36 34.0 4.32 27.4 4.31 20.8 4.28 14.2 4.24 7.6 4.23 1.0 4.24Z",
  "M1.0 4.10 7.6 3.97 14.2 3.82 20.8 3.67 27.4 3.55 34.0 3.47 40.6 3.38 47.2 3.29 53.8 3.20 60.4 3.10 67.0 3.01 73.6 2.92 80.2 2.83 86.8 2.75 93.4 2.68 100.0 2.61 106.6 2.56 113.2 2.52 119.8 2.49 126.4 2.49 133.0 2.51 139.6 2.56 146.2 2.63 152.8 2.72 159.4 2.83 166.0 2.95 172.6 2.99 179.2 2.94 185.8 2.78 192.4 2.53 199.0 2.17 199.0 2.42 192.4 2.98 185.8 3.43 179.2 3.76 172.6 3.98 166.0 4.10 159.4 4.12 152.8 4.14 146.2 4.17 139.6 4.19 133.0 4.23 126.4 4.26 119.8 4.29 113.2 4.32 106.6 4.36 100.0 4.41 93.4 4.48 86.8 4.55 80.2 4.63 73.6 4.72 67.0 4.81 60.4 4.90 53.8 5.00 47.2 5.09 40.6 5.18 34.0 5.27 27.4 5.35 20.8 5.36 14.2 5.33 7.6 5.30 1.0 5.25Z",
] as const;

interface PenStrokeProps {
  /** Red marks a start (the hero name, an open record); blue answers a pointer or focus. */
  tone: "red" | "blue";
  /** Picks one of the strokes, so neighbouring names are not underlined alike. */
  variant?: number;
  /** Draws on, left to right, when it mounts. Off where CSS draws it on a state instead. */
  draw?: boolean;
  /** Only the hero's stroke prints; the rest answer the mouse or the open state. */
  print?: boolean;
}

/**
 * A hand-drawn underline. It sits inside a `penHost` wrapper, absolutely
 * placed just under the baseline, so it never moves the text around it.
 */
export function PenStroke({ tone, variant = 0, draw = true, print = false }: PenStrokeProps) {
  return (
    <svg
      className={styles.pen}
      data-tone={tone}
      data-draw={draw ? "" : undefined}
      data-noprint={print ? undefined : ""}
      viewBox="0 0 200 8"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      <path d={STROKES[variant % STROKES.length]} />
    </svg>
  );
}
