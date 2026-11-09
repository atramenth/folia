import { useLayoutEffect, useMemo, useRef } from "react";
import type { PageCatalog } from "../domain/PageCatalog.ts";
import type { SectionDef } from "../domain/types.ts";

interface Props {
  catalog: PageCatalog;
  /** Position of the page being read. */
  index: number;
  isRead: (page: number) => boolean;
  saved: number[];
  onGo: (index: number) => void;
}

interface Band {
  key: string;
  section: SectionDef;
  first: boolean;
  pages: number[];
}

const BAND = 100;

/**
 * Every page of the book as one small square, in bands of a hundred. Read pages are filled, the
 * page you are on is gilt, bookmarks carry a dot. Tap a square to go there: two taps from anywhere
 * to anywhere, and the whole book readable at a glance.
 */
export function PageMap({ catalog, index, isRead, saved, onGo }: Props) {
  const current = catalog.pageAt(index);
  const root = useRef<HTMLDivElement>(null);

  const bands = useMemo<Band[]>(() => {
    const out: Band[] = [];
    for (const section of catalog.sections) {
      const pages = catalog.pages.filter((p) => p >= section.from && p <= section.to);
      for (let i = 0; i < pages.length; ) {
        // Cut at multiples of 100 so a band reads as "101 to 200".
        const start = pages[i];
        const limit = Math.floor((start - 1) / BAND) * BAND + BAND;
        const chunk: number[] = [];
        while (i < pages.length && pages[i] <= limit) chunk.push(pages[i++]);
        out.push({ key: `${section.id}-${start}`, section, first: start === section.from, pages: chunk });
      }
    }
    return out;
  }, [catalog]);

  useLayoutEffect(() => {
    root.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="map" ref={root}>
      {bands.map((b) => {
        const done = b.pages.filter(isRead).length;
        const pct = Math.round((done / b.pages.length) * 100);
        return (
          <section key={b.key} className="band" aria-label={`Pages ${b.pages[0]} to ${b.pages[b.pages.length - 1]}`}>
            <header className="band__head">
              <span className="band__range">
                {b.first && b.section.id !== catalog.sections[0].id ? <em>{b.section.label}</em> : null}
                {b.pages[0]} to {b.pages[b.pages.length - 1]}
              </span>
              <span className="band__pct">{pct ? `${pct}% read` : ""}</span>
            </header>
            <div className="band__grid">
              {b.pages.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="cell"
                  data-read={isRead(p)}
                  data-saved={saved.includes(p)}
                  data-current={p === current}
                  aria-current={p === current ? "page" : undefined}
                  aria-label={`Page ${p}${isRead(p) ? ", read" : ""}${saved.includes(p) ? ", bookmarked" : ""}`}
                  onClick={() => onGo(catalog.indexOf(p))}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
