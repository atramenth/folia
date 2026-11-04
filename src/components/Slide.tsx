import { useEffect, useRef, useState } from "react";
import { pageImages } from "../services/library.ts";

interface Props {
  page: number;
  /** -1 previous, 0 current, 1 next. */
  offset: -1 | 0 | 1;
}

type Status = "loading" | "ready" | "error";

/** One page image with its own loading and error states. */
export function Slide({ page, offset }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const img = useRef<HTMLImageElement>(null);
  const src = pageImages.url(page) + (attempt ? `?retry=${attempt}` : "");

  // A cached image can finish before React attaches its load handler.
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth > 0) setStatus("ready");
  }, [src]);

  return (
    <div className="slide" data-current={offset === 0} style={{ transform: `translate3d(${offset * 100}%,0,0)` }} aria-hidden={offset !== 0}>
      <div className="slide__zoom">
        <img
          ref={img}
          className={`slide__img${status === "ready" ? " is-ready" : ""}`}
          src={src}
          alt={`Page ${page}`}
          draggable={false}
          decoding="async"
          fetchPriority={offset === 0 ? "high" : "low"}
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
        />
        {status === "loading" && (
          <div className="slide__state" role="status">
            <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
              <circle cx="24" cy="24" r="20" className="spin-track" />
              <circle cx="24" cy="24" r="20" className="spin-arc" />
            </svg>
            <span>{page}</span>
          </div>
        )}
        {status === "error" && (
          <div className="slide__state" data-no-gesture>
            <strong>Page {page} did not load</strong>
            <span>Check the connection, or that pages/{page}.avif exists.</span>
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
    </div>
  );
}
