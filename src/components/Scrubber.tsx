import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ScrubModel } from "../domain/ScrubModel.ts";

interface Props {
  count: number;
  value: number;
  /** Positions where a new section starts. */
  marks: number[];
  labelFor: (position: number) => string;
  onPreview: (position: number | null) => void;
  onCommit: (position: number) => void;
}

interface Drag {
  value: number;
  rate: string | null;
}

/**
 * A page scrubber made for a very long book. Drag to travel; slide your finger
 * up while dragging to slow down and land on an exact page. Nothing loads until you let go.
 */
export function Scrubber({ count, value, marks, labelFor, onPreview, onCommit }: Props) {
  const model = useMemo(() => new ScrubModel(count), [count]);
  const bar = useRef<{ left: number; width: number; mid: number } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const shown = drag ? drag.value : value;
  const pct = count > 1 ? (shown / (count - 1)) * 100 : 0;

  const finish = (commit: boolean) => {
    if (drag && commit) onCommit(drag.value);
    setDrag(null);
    onPreview(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 };
    if (e.key === "Home") onCommit(0);
    else if (e.key === "End") onCommit(count - 1);
    else if (e.key in step) onCommit(Math.min(count - 1, Math.max(0, value + step[e.key])));
    else return;
    e.preventDefault();
  };

  return (
    <div
      className={`scrub${drag ? " is-active" : ""}`}
      role="slider"
      tabIndex={0}
      aria-label="Page position"
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={shown + 1}
      aria-valuetext={`Page ${labelFor(shown)}`}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        const rail = e.currentTarget.querySelector(".scrub__rail")!.getBoundingClientRect();
        bar.current = { left: rail.left, width: rail.width, mid: rail.top + rail.height / 2 };
        e.currentTarget.setPointerCapture(e.pointerId);
        const v = model.begin(e.clientX - rail.left, rail.width);
        setDrag({ value: v, rate: null });
        onPreview(v);
      }}
      onPointerMove={(e) => {
        if (!drag || !bar.current) return;
        const away = Math.abs(e.clientY - bar.current.mid);
        const v = model.move(e.clientX - bar.current.left, away);
        setDrag({ value: v, rate: model.rateLabel(away) });
        onPreview(v);
      }}
      onPointerUp={() => finish(true)}
      onPointerCancel={() => finish(false)}
    >
      <div className="scrub__rail">
        <div className="scrub__line">
          <i className="scrub__fill" style={{ width: `${pct}%` }} />
          {marks.map((m) => (
            <i key={m} className="scrub__mark" style={{ left: `${(m / (count - 1)) * 100}%` }} />
          ))}
        </div>
        <span className="scrub__thumb" style={{ left: `${pct}%` }} />
        {drag && (
          <div className="scrub__bubble" style={{ left: `clamp(2.2rem, ${pct}%, calc(100% - 2.2rem))` }} aria-hidden="true">
            <strong>{labelFor(drag.value)}</strong>
            {drag.rate && <small>{drag.rate}</small>}
          </div>
        )}
      </div>
    </div>
  );
}
