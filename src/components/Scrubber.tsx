import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ScrubModel } from "../domain/ScrubModel.ts";

interface Props {
  count: number;
  value: number;
  /** Positions where a new section starts. */
  sections: number[];
  /** Positions where a chapter starts. */
  chapters: number[];
  /** Positions of bookmarked pages. */
  saved: number[];
  labelFor: (position: number) => string;
  /** Short line shown under the number while dragging, such as the chapter name. */
  captionFor: (position: number) => string;
  onPreview: (position: number | null) => void;
  onCommit: (position: number) => void;
}

interface Drag {
  value: number;
  rate: string | null;
}

/**
 * The fast scroll rail on the right edge of the screen, for travelling a very long book.
 * Grab the handle and the page number appears beside your thumb; slide left to slow down and land on an
 * exact page. Nothing loads until you let go. Where the handle sits comes from the --frac variable
 * the reader keeps up to date, so scrolling moves it without rendering anything.
 */
export function Scrubber({ count, value, sections, chapters, saved, labelFor, captionFor, onPreview, onCommit }: Props) {
  const model = useMemo(() => new ScrubModel(count), [count]);
  const geo = useRef<{ top: number; height: number; x: number } | null>(null);
  /** Where a touch began, until it has moved far enough to count as a drag rather than a tap. */
  const pending = useRef<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const shown = drag ? drag.value : value;
  const at = (i: number) => (count > 1 ? (i / (count - 1)) * 100 : 0);

  const finish = (commit: boolean) => {
    if (drag && commit) onCommit(drag.value);
    setDrag(null);
    onPreview(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1, PageUp: -10, PageDown: 10 };
    if (e.key === "Home") onCommit(0);
    else if (e.key === "End") onCommit(count - 1);
    else if (e.key in step) onCommit(Math.min(count - 1, Math.max(0, value + step[e.key])));
    else return;
    e.preventDefault();
  };

  return (
    <div className={`rail${drag ? " is-active" : ""}`}>
      <div className="rail__track" ref={track}>
        <i className="rail__line" />
        {sections.map((m) => (
          <i key={`s${m}`} className="rail__tick rail__tick--section" style={{ top: `${at(m)}%` }} />
        ))}
        {chapters.map((m) => (
          <i key={`c${m}`} className="rail__tick" style={{ top: `${at(m)}%` }} />
        ))}
        {saved.map((m) => (
          <i key={`b${m}`} className="rail__tick rail__tick--saved" style={{ top: `${at(m)}%` }} />
        ))}
        <span className="rail__thumb" style={drag ? { top: `${at(drag.value)}%` } : undefined} />
        {/* Only the handle can be grabbed, so scrolling with a thumb near the edge never starts a jump. */}
        <div
          className="rail__grab"
          style={drag ? { top: `${at(drag.value)}%` } : undefined}
          role="slider"
          tabIndex={0}
          aria-label="Position in the book"
          aria-orientation="vertical"
          aria-valuemin={1}
          aria-valuemax={count}
          aria-valuenow={shown + 1}
          aria-valuetext={`Page ${labelFor(shown)}`}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => {
            const r = track.current!.getBoundingClientRect();
            geo.current = { top: r.top, height: r.height, x: r.right };
            e.currentTarget.setPointerCapture(e.pointerId);
            pending.current = e.clientY;
          }}
          onPointerMove={(e) => {
            if (!geo.current) return;
            if (!drag) {
              if (pending.current === null || Math.abs(e.clientY - pending.current) < 6) return;
              pending.current = null;
              const v = model.begin(e.clientY - geo.current.top, geo.current.height);
              setDrag({ value: v, rate: null });
              onPreview(v);
              return;
            }
            const away = Math.max(0, geo.current.x - e.clientX - 24);
            const v = model.move(e.clientY - geo.current.top, away);
            setDrag({ value: v, rate: model.rateLabel(away) });
            onPreview(v);
          }}
          onPointerUp={() => {
            pending.current = null;
            finish(true);
          }}
          onPointerCancel={() => {
            pending.current = null;
            finish(false);
          }}
        />
        {drag && (
          <div className="rail__bubble" style={{ top: `clamp(2.2rem, ${at(drag.value)}%, calc(100% - 2.2rem))` }} aria-hidden="true">
            <strong>{labelFor(drag.value)}</strong>
            <small>{captionFor(drag.value)}</small>
            {drag.rate && <em>{drag.rate}</em>}
          </div>
        )}
      </div>
    </div>
  );
}
