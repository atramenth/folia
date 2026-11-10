import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { PageCatalog } from "../domain/PageCatalog.ts";
import type { Place, SurahDef } from "../domain/types.ts";
import { useStore } from "../hooks/useStore.ts";
import { bookmarks } from "../services/BookmarkStore.ts";
import { reading } from "../services/library.ts";
import { IconList, IconMap, IconPages, IconSearch, IconStar, IconTrash } from "./Icons.tsx";
import { PageMap } from "./PageMap.tsx";
import { Sheet } from "./Sheet.tsx";

export type NavTab = "surahs" | "parts" | "map" | "marks";

interface Props {
  catalog: PageCatalog;
  index: number;
  onGo: (index: number) => void;
  onClose: () => void;
  initialTab?: NavTab;
}

const fmt = (n: number) => n.toLocaleString("en-US");

/** Lower case, no accents or punctuation, so "fatiha" finds "Al-Fātihatu'l Kitāb" and "imran" finds "'Al-e-Imrān". */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

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

type Hit = { kind: "page"; page: number; note?: string } | { kind: "surah"; surah: SurahDef } | { kind: "part"; part: number } | { kind: "section"; id: string };

/**
 * The index of the book. One box finds a sūrah by name or number, or a page by number; below it the
 * sūrahs, the 30 parts, the map of every page, and your bookmarks.
 */
export function JumpSheet({ catalog, index, onGo, onClose, initialTab = "surahs" }: Props) {
  const marks = useStore(bookmarks);
  const r = useStore(reading);
  const [tab, setTab] = useState<NavTab>(initialTab);
  const [text, setText] = useState("");
  const [place, setPlace] = useState<Place | "all">("all");
  const body = useRef<HTMLDivElement>(null);

  const go = (i: number) => {
    onGo(i);
    onClose();
  };
  const goPage = (page: number) => go(catalog.nearestIndex(page));

  const here = catalog.surahAt(index);
  const hereSection = catalog.sectionAt(index);
  const herePart = catalog.partAt(index);

  // How much of each sūrah has been read. `r` changes whenever a page is marked read.
  const readShare = useMemo(() => {
    const out = new Map<number, number>();
    for (const x of catalog.surahs) {
      const pages = catalog.pages.filter((p) => p >= x.page && p <= catalog.surahEnd(x));
      out.set(x.number, pages.length ? reading.countRead(pages) / pages.length : 0);
    }
    return out;
  }, [catalog, r]);

  const done = useMemo(() => reading.countRead(catalog.pages), [catalog, r]);
  const share = done / catalog.total;
  const today = r.today.pages.length;
  const streak = reading.streak;
  const goalPct = Math.min(100, Math.round((today / Math.max(1, r.goal)) * 100));

  // Search: a page number, a sūrah number or name, "part 5", or the Introduction and Index.
  const hits = useMemo<Hit[] | null>(() => {
    const q = text.trim();
    if (!q) return null;
    const out: Hit[] = [];
    const q2 = norm(q);
    const partQuery = /^(?:part|juz|para)\s*(\d{1,2})$/i.exec(q);
    if (partQuery) {
      const n = Number(partQuery[1]);
      if (n >= 1 && n <= 30) out.push({ kind: "part", part: n });
    }
    if (/^\d+$/.test(q)) {
      const n = Number(q);
      if (n >= catalog.firstPage && n <= catalog.lastPage) {
        const page = catalog.pageAt(catalog.nearestIndex(n));
        out.push({ kind: "page", page, note: page === n ? undefined : `Page ${n} is not in the book. The next page is ${page}.` });
      }
      const x = catalog.surahs.find((s) => s.number === n);
      if (x) out.push({ kind: "surah", surah: x });
    } else if (q2) {
      for (const x of catalog.surahs) if (norm(x.name).includes(q2)) out.push({ kind: "surah", surah: x });
      for (const s of catalog.sections.slice(1)) if (norm(s.label).includes(q2)) out.push({ kind: "section", id: s.id });
    }
    return out;
  }, [text, catalog]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const first = hits?.[0];
    if (!first) return;
    if (first.kind === "page") goPage(first.page);
    else if (first.kind === "surah") goPage(first.surah.page);
    else if (first.kind === "part") goPage(catalog.parts[first.part - 1].page);
    else goPage(catalog.sections.find((s) => s.id === first.id)!.from);
  };

  // Open on the sūrah or part being read.
  useEffect(() => {
    if (text) return;
    body.current?.querySelector<HTMLElement>('[aria-current="true"], [aria-current="page"]')?.scrollIntoView({ block: "center" });
  }, [tab, text]);

  const places = useMemo(() => {
    const count = (p: Place) => catalog.surahs.filter((s) => s.place === p).length;
    return { Makkah: count("Makkah"), Madinah: count("Madinah") };
  }, [catalog]);

  const partsOf = (x: SurahDef) => {
    const { first, last } = catalog.partsOfSurah(x);
    return first === last ? `Part ${first}` : `Parts ${first} to ${last}`;
  };

  const surahRow = (x: SurahDef) => {
    const pct = Math.round((readShare.get(x.number) ?? 0) * 100);
    const on = here?.number === x.number;
    return (
      <li key={x.number}>
        <button type="button" className={`srow${on ? " is-on" : ""}`} aria-current={on ? "true" : undefined} onClick={() => goPage(x.page)}>
          <span className="srow__n">{x.number}</span>
          <span className="srow__main">
            <strong>{x.name}</strong>
            <small>
              {x.place} <span aria-hidden="true">·</span> {x.ayat} āyāt <span aria-hidden="true">·</span> {partsOf(x)}
            </small>
          </span>
          <span className="srow__page">
            <small>page</small>
            {x.page}
          </span>
          {pct > 0 && <i className="srow__bar" style={{ width: `${pct}%` }} />}
        </button>
      </li>
    );
  };

  const sectionRow = (id: string) => {
    const s = catalog.sections.find((x) => x.id === id)!;
    const on = hereSection.id === s.id;
    return (
      <li key={s.id}>
        <button type="button" className={`srow srow--section${on ? " is-on" : ""}`} aria-current={on ? "true" : undefined} onClick={() => goPage(s.from)}>
          <span className="srow__n" aria-hidden="true">
            <IconStar size={18} />
          </span>
          <span className="srow__main">
            <strong>{s.label}</strong>
            <small>{fmt(catalog.pageCount(s))} pages</small>
          </span>
          <span className="srow__page">
            <small>page</small>
            {s.from}
          </span>
        </button>
      </li>
    );
  };

  const sticky = (
    <>
      <div className="stats stats--compact">
        <Ring value={share} />
        <div className="stats__text">
          <strong>
            Page {catalog.pageAt(index)} <span>of {fmt(catalog.lastPage)}</span>
          </strong>
          <small>{here ? `${here.name}${herePart ? `, part ${herePart}` : ""}` : hereSection.label}</small>
          <div className="goal" role="img" aria-label={`${today} of ${r.goal} pages today`}>
            <i style={{ width: `${goalPct}%` }} />
          </div>
          <small>
            Today {today} of {r.goal} pages{streak > 1 ? `  ·  ${streak} day streak` : ""}
          </small>
        </div>
      </div>

      <form className="search" onSubmit={submit} role="search">
        <IconSearch />
        <label className="sr-only" htmlFor="nav-search">
          Search by sūrah name, sūrah number or page
        </label>
        <input id="nav-search" type="search" inputMode="search" enterKeyHint="go" autoComplete="off" autoCorrect="off" spellCheck={false} placeholder="Sūrah name, number or page" value={text} onChange={(e) => setText(e.target.value)} />
        {text && (
          <button type="button" className="search__clear" onClick={() => setText("")} aria-label="Clear search">
            Clear
          </button>
        )}
      </form>

      {hits === null && (
        <div className="tabs" role="tablist" aria-label="Browse by">
          <button type="button" role="tab" id="tab-surahs" aria-selected={tab === "surahs"} aria-controls="panel-nav" onClick={() => setTab("surahs")}>
            <IconList /> Surahs
          </button>
          <button type="button" role="tab" id="tab-parts" aria-selected={tab === "parts"} aria-controls="panel-nav" onClick={() => setTab("parts")}>
            <IconPages /> Parts
          </button>
          <button type="button" role="tab" id="tab-map" aria-selected={tab === "map"} aria-controls="panel-nav" onClick={() => setTab("map")}>
            <IconMap /> Map
          </button>
          <button type="button" role="tab" id="tab-marks" aria-selected={tab === "marks"} aria-controls="panel-nav" onClick={() => setTab("marks")}>
            <IconStar size={20} /> Marks{marks.pages.length > 0 && <b>{marks.pages.length}</b>}
          </button>
        </div>
      )}
    </>
  );

  const shownSurahs = catalog.surahs.filter((s) => place === "all" || s.place === place);

  return (
    <Sheet label="Index of the book" onClose={onClose} header="Index" tall sticky={sticky}>
      <div role={hits === null ? "tabpanel" : "region"} id="panel-nav" aria-labelledby={hits === null ? `tab-${tab}` : undefined} aria-label={hits === null ? undefined : "Search results"} ref={body}>
        {hits !== null &&
          (hits.length === 0 ? (
            <div className="empty">
              <IconSearch />
              <strong>Nothing found</strong>
              <p>Try a sūrah name such as Baqarah, a sūrah number, a page number, or "part 5".</p>
            </div>
          ) : (
            <ul className="slist" aria-live="polite">
              {hits.map((h) => {
                if (h.kind === "surah") return surahRow(h.surah);
                if (h.kind === "section") return sectionRow(h.id);
                if (h.kind === "part") {
                  const p = catalog.parts[h.part - 1];
                  return (
                    <li key={`part${h.part}`}>
                      <button type="button" className="srow srow--page" onClick={() => goPage(p.page)}>
                        <span className="srow__n">{h.part}</span>
                        <span className="srow__main">
                          <strong>Part {h.part}</strong>
                          <small>
                            {catalog.surahs[p.surah - 1].name}, āyah {p.ayah}
                          </small>
                        </span>
                        <span className="srow__page">
                          <small>page</small>
                          {p.page}
                        </span>
                      </button>
                    </li>
                  );
                }
                return (
                  <li key={`page${h.page}`}>
                    <button type="button" className="srow srow--page" onClick={() => goPage(h.page)}>
                      <span className="srow__n" aria-hidden="true">
                        <IconPages />
                      </span>
                      <span className="srow__main">
                        <strong>Go to page {h.page}</strong>
                        <small>{h.note ?? catalog.surahAt(catalog.indexOf(h.page))?.name ?? catalog.sectionAt(catalog.indexOf(h.page)).label}</small>
                      </span>
                      <span className="srow__page">
                        <small>page</small>
                        {h.page}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}

        {hits === null && tab === "surahs" && (
          <>
            <div className="chips" role="radiogroup" aria-label="Filter sūrahs">
              <button type="button" role="radio" aria-checked={place === "all"} className={place === "all" ? "is-on" : ""} onClick={() => setPlace("all")}>
                All {catalog.surahs.length}
              </button>
              <button type="button" role="radio" aria-checked={place === "Makkah"} className={place === "Makkah" ? "is-on" : ""} onClick={() => setPlace("Makkah")}>
                Makkah {places.Makkah}
              </button>
              <button type="button" role="radio" aria-checked={place === "Madinah"} className={place === "Madinah" ? "is-on" : ""} onClick={() => setPlace("Madinah")}>
                Madinah {places.Madinah}
              </button>
            </div>
            <ul className="slist">{shownSurahs.map(surahRow)}</ul>
            {place === "all" && (
              <>
                <h3 className="slist__head">Also in the book</h3>
                <ul className="slist">{catalog.sections.slice(1).map((s) => sectionRow(s.id))}</ul>
              </>
            )}
          </>
        )}

        {hits === null && tab === "parts" && (
          <ul className="plist">
            {catalog.parts.map((p) => {
              const on = herePart === p.part;
              return (
                <li key={p.part} className={`part${on ? " is-on" : ""}`}>
                  <button type="button" className="part__head" aria-current={on ? "true" : undefined} onClick={() => goPage(p.page)}>
                    <span className="part__n">{p.part}</span>
                    <span className="part__title">
                      <strong>Part {p.part}</strong>
                      <small>
                        from {catalog.surahs[p.surah - 1].name}, āyah {p.ayah}
                      </small>
                    </span>
                    <span className="srow__page">
                      <small>{p.about ? "about page" : "page"}</small>
                      {p.page}
                    </span>
                  </button>
                  <div className="part__surahs">
                    {catalog.surahsInPart(p.part).map(({ surah, continues }) => (
                      <button key={surah.number} type="button" className="pill" onClick={() => goPage(continues ? Math.max(surah.page, p.page) : surah.page)}>
                        <i>{surah.number}</i> {surah.name}
                        {continues && <em>continued</em>}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {hits === null && tab === "map" && <PageMap catalog={catalog} index={index} isRead={(p) => reading.isRead(p)} saved={marks.pages} onGo={go} />}

        {hits === null &&
          tab === "marks" &&
          (marks.pages.length === 0 ? (
            <div className="empty">
              <IconStar size={44} />
              <strong>No bookmarks yet</strong>
              <p>Tap the bookmark in the bar below a page to keep your place. Add a note to remember why.</p>
            </div>
          ) : (
            <ul className="marks">
              {marks.pages.map((p) => {
                const i = catalog.nearestIndex(p);
                const x = catalog.surahAt(i);
                return (
                  <li key={p} className="mark">
                    <button type="button" className="mark__go" onClick={() => go(i)} aria-label={`Go to page ${p}`}>
                      <strong>{p}</strong>
                      <small>{x ? x.name : catalog.sectionAt(i).label}</small>
                    </button>
                    <label className="sr-only" htmlFor={`note-${p}`}>
                      Note for page {p}
                    </label>
                    <input id={`note-${p}`} className="mark__note" placeholder="Add a note" maxLength={160} value={marks.notes[p] ?? ""} onChange={(e) => bookmarks.setNote(p, e.target.value)} />
                    <button type="button" className="icon-btn" onClick={() => bookmarks.remove(p)} aria-label={`Remove bookmark on page ${p}`}>
                      <IconTrash />
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}
      </div>
    </Sheet>
  );
}
