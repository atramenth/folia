import { useMemo, useState, type FormEvent } from "react";
import type { PageCatalog } from "../domain/PageCatalog.ts";
import { useStore } from "../hooks/useStore.ts";
import { bookmarks } from "../services/BookmarkStore.ts";
import { reading } from "../services/library.ts";
import { IconList, IconMap, IconTrash, IconStar } from "./Icons.tsx";
import { PageMap } from "./PageMap.tsx";
import { Sheet } from "./Sheet.tsx";

export type NavTab = "map" | "contents" | "marks";

interface Props {
  catalog: PageCatalog;
  index: number;
  onGo: (index: number) => void;
  onClose: () => void;
  initialTab?: NavTab;
}

const fmt = (n: number) => n.toLocaleString("en-US");

/** A small ring showing how much of the book has been read. */
function Ring({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
      <circle cx="32" cy="32" r={r} className="ring__track" />
      <circle cx="32" cy="32" r={r} className="ring__arc" strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" className="ring__text">
        {Math.round(value * 100)}
      </text>
    </svg>
  );
}

/**
 * Navigate: everything for getting around a long book in one sheet. A number box, the page map,
 * Contents, and your bookmarks with their notes, above a short summary of how far you have read.
 */
export function JumpSheet({ catalog, index, onGo, onClose, initialTab = "map" }: Props) {
  const marks = useStore(bookmarks);
  const r = useStore(reading);
  const [tab, setTab] = useState<NavTab>(initialTab);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const go = (i: number) => {
    onGo(i);
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(text.trim());
    if (!Number.isInteger(n) || text.trim() === "" || n < catalog.firstPage || n > catalog.lastPage) {
      setError(`Enter a page from ${catalog.firstPage} to ${catalog.lastPage}.`);
      return;
    }
    if (!catalog.has(n)) {
      const next = catalog.pageAt(catalog.nearestIndex(n));
      setError(`Page ${n} is not in this set. The next page is ${next}.`);
      setText(String(next));
      return;
    }
    go(catalog.indexOf(n));
  };

  const done = useMemo(() => reading.countRead(catalog.pages), [catalog, r]);
  const share = done / catalog.total;
  const today = r.today.pages.length;
  const streak = reading.streak;
  const goalPct = Math.min(100, Math.round((today / Math.max(1, r.goal)) * 100));
  const section = catalog.sectionAt(index);
  const chapter = catalog.chapterAt(index);

  const sticky = (
    <>
      <div className="stats">
        <Ring value={share} />
        <div className="stats__text">
          <strong>
            Page {catalog.pageAt(index)} <span>of {fmt(catalog.lastPage)}</span>
          </strong>
          <small>{chapter ? `${chapter.title}, ${section.label}` : section.label}</small>
          <div className="goal" role="img" aria-label={`${today} of ${r.goal} pages today`}>
            <i style={{ width: `${goalPct}%` }} />
          </div>
          <small>
            Today {today} of {r.goal} pages{streak > 1 ? `  ·  ${streak} day streak` : ""}
          </small>
        </div>
      </div>

      <form className="jump__form" onSubmit={submit} noValidate>
        <label className="sr-only" htmlFor="jump-page">
          Page number
        </label>
        <input
          id="jump-page"
          className="jump__input"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          placeholder="Go to page"
          value={text}
          onChange={(e) => {
            setText(e.target.value.replace(/[^0-9]/g, ""));
            setError(null);
          }}
        />
        <button type="submit" className="btn btn--primary">
          Go
        </button>
      </form>
      {error && (
        <p className="jump__error" role="alert">
          {error}
        </p>
      )}

      <div className="tabs" role="tablist" aria-label="Navigate by">
        <button type="button" role="tab" id="tab-map" aria-selected={tab === "map"} aria-controls="panel-nav" onClick={() => setTab("map")}>
          <IconMap /> Map
        </button>
        <button type="button" role="tab" id="tab-contents" aria-selected={tab === "contents"} aria-controls="panel-nav" onClick={() => setTab("contents")}>
          <IconList /> Contents
        </button>
        <button type="button" role="tab" id="tab-marks" aria-selected={tab === "marks"} aria-controls="panel-nav" onClick={() => setTab("marks")}>
          <IconStar size={20} /> Marks{marks.pages.length > 0 && <b>{marks.pages.length}</b>}
        </button>
      </div>
    </>
  );

  return (
    <Sheet label="Navigate the book" onClose={onClose} header="Navigate" tall sticky={sticky}>
      <div role="tabpanel" id="panel-nav" aria-labelledby={`tab-${tab}`}>
        {tab === "map" && <PageMap catalog={catalog} index={index} isRead={(p) => reading.isRead(p)} saved={marks.pages} onGo={go} />}

        {tab === "contents" && (
          <ul className="toc">
            {catalog.sections.map((s) => {
              const pages = catalog.pages.filter((p) => p >= s.from && p <= s.to);
              const pct = Math.round((reading.countRead(pages) / pages.length) * 100);
              const chapters = catalog.chapters.filter((c) => c.page >= s.from && c.page <= s.to);
              return (
                <li key={s.id}>
                  <button type="button" className={`toc__row toc__row--section${s.id === section.id ? " is-on" : ""}`} onClick={() => go(catalog.sectionStartIndex(s))}>
                    <strong>{s.label}</strong>
                    <small>
                      {fmt(pages.length)} pages{pct ? `  ·  ${pct}% read` : ""}
                    </small>
                    <i className="toc__bar" style={{ width: `${pct}%` }} />
                  </button>
                  {chapters.map((c) => (
                    <button key={c.page} type="button" className={`toc__row toc__row--chapter${chapter?.page === c.page ? " is-on" : ""}`} onClick={() => go(catalog.indexOf(c.page))}>
                      <strong>{c.title}</strong>
                      {c.sub && <small>{c.sub}</small>}
                      <span className="toc__page">{c.page}</span>
                    </button>
                  ))}
                </li>
              );
            })}
            {catalog.chapters.length < 2 && <li className="toc__note">Chapter titles are listed here when they are added to the book catalog.</li>}
          </ul>
        )}

        {tab === "marks" &&
          (marks.pages.length === 0 ? (
            <div className="empty">
              <IconStar size={44} />
              <strong>No bookmarks yet</strong>
              <p>Tap the bookmark in the bar below a page to keep your place. Add a note to remember why.</p>
            </div>
          ) : (
            <ul className="marks">
              {marks.pages.map((p) => (
                <li key={p} className="mark">
                  <button type="button" className="mark__go" onClick={() => go(catalog.nearestIndex(p))} aria-label={`Go to page ${p}`}>
                    <strong>{p}</strong>
                    <small>{catalog.sectionAt(catalog.nearestIndex(p)).label}</small>
                  </button>
                  <label className="sr-only" htmlFor={`note-${p}`}>
                    Note for page {p}
                  </label>
                  <input id={`note-${p}`} className="mark__note" placeholder="Add a note" maxLength={160} value={marks.notes[p] ?? ""} onChange={(e) => bookmarks.setNote(p, e.target.value)} />
                  <button type="button" className="icon-btn" onClick={() => bookmarks.remove(p)} aria-label={`Remove bookmark on page ${p}`}>
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </Sheet>
  );
}
