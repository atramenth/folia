import type { CSSProperties } from "react";
import { FRAMES, TARGET_FRAME } from "../data/frames.ts";

/** Height divided by width of a typical scan, used to turn the page window into a ratio. */
const SCAN_RATIO = 1.4235;

/**
 * The part of the aligned scan that is shown, as fractions of the scan: a little beyond the printed frame,
 * keeping the header line above it. Anything outside is cropped, which hides the dark scanner edges.
 */
const WINDOW = { x0: 0.05, y0: 0.03, x1: 0.95, y1: 0.985 } as const;
const WW = WINDOW.x1 - WINDOW.x0;
const WH = WINDOW.y1 - WINDOW.y0;

/** Height divided by width of one displayed page. */
export const PAGE_RATIO = (WH * SCAN_RATIO) / WW;

const pct = (n: number) => `${(n * 100).toFixed(4)}%`;

/**
 * Styles that place a scan inside its page window so every printed frame lands on the same spot:
 * the scan is rotated to level its frame, scaled to the typical frame size and moved to the typical position.
 * The image is stretched over the window box and the transform does the rest, so no image is ever re-encoded.
 */
export function frameStyle(page: number): CSSProperties {
  const [tcx, tcy, tw, th] = TARGET_FRAME;
  const [cx, cy, w, h, angle] = FRAMES[page] ?? [tcx, tcy, tw, th, 0];
  return {
    position: "absolute",
    left: pct(-WINDOW.x0 / WW),
    top: pct(-WINDOW.y0 / WH),
    width: pct(1 / WW),
    height: pct(1 / WH),
    objectFit: "fill",
    transformOrigin: `${pct(cx)} ${pct(cy)}`,
    transform: `translate(${pct(tcx - cx)}, ${pct(tcy - cy)}) scale(${(tw / w).toFixed(4)}, ${(th / h).toFixed(4)}) rotate(${(-angle).toFixed(2)}deg)`,
  };
}
