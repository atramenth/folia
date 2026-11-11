import { useEffect, useRef, useState } from "react";
import { pageImages } from "../services/library.ts";
import { PAGE_RATIO, frameStyle } from "../domain/PageFrame.ts";
import { IconStar } from "./Icons.tsx";

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
        <div className="slide__page" style={{ aspectRatio: `1 / ${PAGE_RATIO}`, width: `min(100cqw, calc(100cqh / ${PAGE_RATIO}))` }}>
          <img
            ref={img}
            className={`slide__img${status === "ready" ? " is-ready" : ""}`}
            style={frameStyle(page)}
            src={src}
            alt={`Page ${page}`}
            draggable={false}
            decoding="async"
            fetchPriority={offset === 0 ? "high" : "low"}
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
        </div>
        {status === "loading" && (
          <div className="slide__state" role="status">
            <span className="spinner" aria-hidden="true">
              <IconStar size={34} />
            </span>
            <span>{page}</span>
          </div>
        )}
        {status === "error" && (
          <div className="slide__state" data-no-gesture>
            <strong>Page {page} did not load</strong>
            <span>Check the connection, then try again.</span>
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
