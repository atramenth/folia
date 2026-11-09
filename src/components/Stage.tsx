import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type Ref } from "react";
import type { PageCatalog } from "../domain/PageCatalog.ts";
import type { Direction, TapZone } from "../domain/types.ts";
import { StageController } from "../gestures/StageController.ts";
import { Slide } from "./Slide.tsx";

export interface StageHandle {
  slideBy(direction: Direction): boolean;
  resetZoom(): void;
}

interface Props {
  catalog: PageCatalog;
  index: number;
  onNavigate: (direction: Direction) => void;
  onTap: (zone: TapZone) => void;
  onZoomChange: (zoomed: boolean) => void;
  handleRef: Ref<StageHandle>;
}

/** The gesture surface: the current page with its two neighbours on a sliding track. */
export function Stage({ catalog, index, onNavigate, onTap, onZoomChange, handleRef }: Props) {
  const stageEl = useRef<HTMLDivElement>(null);
  const trackEl = useRef<HTMLDivElement>(null);
  const controller = useRef<StageController | null>(null);

  const latest = useRef({ catalog, index, onNavigate, onTap, onZoomChange });
  latest.current = { catalog, index, onNavigate, onTap, onZoomChange };

  useEffect(() => {
    const ctl = new StageController(stageEl.current!, trackEl.current!, {
      canNavigate: (d) => latest.current.catalog.canMove(latest.current.index, d),
      onNavigate: (d) => latest.current.onNavigate(d),
      onTap: (zone) => latest.current.onTap(zone),
      onZoomChange: (z) => latest.current.onZoomChange(z),
    });
    controller.current = ctl;
    const detach = ctl.attach();
    return () => {
      detach();
      controller.current = null;
    };
  }, []);

  useImperativeHandle(handleRef, () => ({
    slideBy: (d) => controller.current?.slideBy(d) ?? false,
    resetZoom: () => controller.current?.resetZoom(true),
  }));

  // New current page: drop the drag offset and zoom in the same frame the slides re-position.
  useLayoutEffect(() => {
    controller.current?.reset();
  }, [index]);

  const offsets: (-1 | 0 | 1)[] = [-1, 0, 1];
  return (
    <div ref={stageEl} className="stage">
      <div ref={trackEl} className="track">
        {offsets.map((o) => {
          const i = index + o;
          if (i < 0 || i > catalog.lastIndex) return null;
          const page = catalog.pageAt(i);
          return <Slide key={page} page={page} offset={o} />;
        })}
      </div>
    </div>
  );
}
