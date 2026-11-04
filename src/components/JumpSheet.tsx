import { useState, type FormEvent } from "react";
import type { PageCatalog } from "../domain/PageCatalog.ts";
import { useStore } from "../hooks/useStore.ts";
import { bookmarks } from "../services/BookmarkStore.ts";
import { IconClose } from "./Icons.tsx";
import { Sheet } from "./Sheet.tsx";

interface Props {
  catalog: PageCatalog;
  index: number;
  onGo: (index: number) => void;
  onClose: () => void;
}

const STEPS = [-100, -10, 10, 100];

/** Go to a page number, a section, a bookmark, or move by tens and hundreds. */
export function JumpSheet({ catalog, index, onGo, onClose }: Props) {
  const marks = useStore(bookmarks).pages;
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const current = catalog.sectionAt(index);

  const go = (i: number) => {
    onGo(i);
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(text.trim());
    if (!Number.isInteger(n) || text.trim() === "" || n < catalog.firstPage || n > catalog.lastPage) {
      setError(`Enter a page number from ${catalog.firstPage} to ${catalog.lastPage}.`);
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

  return (
    <Sheet label="Go to a page" onClose={onClose} header="Go to">
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
          placeholder="Page number"
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

      <div className="setting">
        <div className="setting__label">Sections</div>
        <div className="jump__sections">
          {catalog.sections.map((s) => (
            <button key={s.id} type="button" className={`jump__section${s.id === current.id ? " is-on" : ""}`} onClick={() => go(catalog.sectionStartIndex(s))}>
              <strong>{s.label}</strong>
              <small>
                {s.from} to {s.to}
              </small>
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <div className="setting__label">Move by</div>
        <div className="jump__steps">
          {STEPS.map((s) => (
            <button key={s} type="button" className="btn" onClick={() => go(catalog.clamp(index + s))} disabled={catalog.clamp(index + s) === index}>
              {s > 0 ? `+${s}` : s}
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <div className="setting__label">Bookmarks</div>
        {marks.length === 0 ? (
          <p className="jump__empty">Tap the bookmark button below a page to keep your place.</p>
        ) : (
          <ul className="jump__marks">
            {marks.map((p) => (
              <li key={p}>
                <button type="button" className="jump__mark" onClick={() => go(catalog.nearestIndex(p))}>
                  {p}
                </button>
                <button type="button" className="jump__unmark" onClick={() => bookmarks.remove(p)} aria-label={`Remove bookmark on page ${p}`}>
                  <IconClose />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
