import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { pageImages } from "../services/library.ts";
import { frameStyle } from "../domain/PageFrame.ts";
import { IconStar } from "./Icons.tsx";

interface Props {
  /** Printed page number. */
  page: number;
  /** Position in the catalog; the reader places the page from it. */
  position: number;
}

type Status = "loading" | "ready" | "error";

/** Pages that have loaded once, so scrolling back to one does not flash an empty sheet. */
const loaded = new Set<number>();

/** One page of the continuous reader. The reader positions it; the page loads its own image. */
export const FlowPage = memo(function FlowPage({ page, position }: Props) {
  const [status, setStatus] = useState<Status>(loaded.has(page) ? "ready" : "loading");
  const [attempt, setAttempt] = useState(0);
  const img = useRef<HTMLImageElement>(null);
  const src = pageImages.url(page) + (attempt ? `?retry=${attempt}` : "");
  const instant = useRef(loaded.has(page));

  // A cached image can finish before React attaches its load handler.
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth > 0) {
      loaded.add(page);
      setStatus("ready");
    }
  }, [src, page]);

  return (
    <div className="fp" style={{ "--i": position } as CSSProperties} data-page={page} data-state={status}>
      <span className="fp__label" aria-hidden="true">
        {page}
      </span>
      <img
        ref={img}
        className={`fp__img${status === "ready" ? " is-ready" : ""}${instant.current ? " is-instant" : ""}`}
        src={src}
        style={frameStyle(page)}
        alt={`Page ${page}`}
        draggable={false}
        decoding="async"
        onLoad={() => {
          loaded.add(page);
          setStatus("ready");
        }}
        onError={() => setStatus("error")}
      />
      {status === "loading" && (
        <div className="fp__state" role="status">
          <span className="spinner" aria-hidden="true">
            <IconStar size={34} />
          </span>
          <span className="fp__num">{page}</span>
        </div>
      )}
      {status === "error" && (
        <div className="fp__state" data-no-gesture>
          <strong>Page {page} did not load</strong>
          <span className="fp__hint">Check the connection, then try again.</span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setStatus("loading");
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
});
