import type { ReactNode } from "react";
import type { PageCatalog } from "../domain/PageCatalog.ts";
import { useStore } from "../hooks/useStore.ts";
import { reading } from "../services/library.ts";
import { settings, ZOOM_MAX, ZOOM_MIN, type ReadMode, type SlideSeconds, type ThemeChoice, type ToneChoice } from "../services/SettingsStore.ts";
import { IconMinus, IconPages, IconPlus, IconScroll } from "./Icons.tsx";
import { Sheet } from "./Sheet.tsx";

const MODES: { id: ReadMode; label: string; hint: string; icon: ReactNode }[] = [
  { id: "flow", label: "Scroll", hint: "One long column", icon: <IconScroll /> },
  { id: "pages", label: "Pages", hint: "Swipe to turn", icon: <IconPages /> },
];

const TONES: { id: ToneChoice; label: string; hint: string }[] = [
  { id: "original", label: "Original", hint: "As scanned" },
  { id: "warm", label: "Warm", hint: "Softer, like old paper" },
  { id: "night", label: "Night", hint: "Light text on dark" },
];

const THEMES: { id: ThemeChoice; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Follows your device" },
  { id: "light", label: "Paper", hint: "Cool ink on soft grey" },
  { id: "dark", label: "Slate", hint: "Bone on near black" },
];

const SPEEDS: SlideSeconds[] = [3, 5, 8, 12];
const GOALS = [5, 10, 20, 40];

/** Display and reading settings. */
export function SettingsSheet({ catalog, onClose }: { catalog: PageCatalog; onClose: () => void }) {
  const s = useStore(settings);
  const r = useStore(reading);
  const step = (d: number) => settings.setZoom(Math.round((s.zoom + d) * 20) / 20);

  return (
    <Sheet label="Display and reading" onClose={onClose} header="Display">
      <div className="setting">
        <div className="setting__label">Reading</div>
        <div className="seg" role="radiogroup" aria-label="Reading mode">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={s.mode === m.id} className={s.mode === m.id ? "is-on" : ""} onClick={() => settings.setMode(m.id)}>
              {m.icon}
              <strong>{m.label}</strong>
              <small>{m.hint}</small>
            </button>
          ))}
        </div>
      </div>

      {s.mode === "flow" && (
        <div className="setting">
          <div className="setting__label">
            Page size <output>{s.zoom <= 1.02 ? "Fit to width" : `${Math.round(s.zoom * 100)}%`}</output>
          </div>
          <div className="stepper">
            <button type="button" className="icon-btn" onClick={() => step(-0.2)} disabled={s.zoom <= ZOOM_MIN} aria-label="Smaller">
              <IconMinus />
            </button>
            <input type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={0.05} value={s.zoom} onChange={(e) => settings.setZoom(Number(e.target.value))} aria-label="Page size" />
            <button type="button" className="icon-btn" onClick={() => step(0.2)} disabled={s.zoom >= ZOOM_MAX} aria-label="Larger">
              <IconPlus />
            </button>
          </div>
          <p className="setting__note">Pinch or double tap on a page does the same. Your size is remembered from page to page. Turn the phone sideways for the widest page.</p>
        </div>
      )}

      <div className="setting">
        <div className="setting__label">Page tone</div>
        <div className="seg" role="radiogroup" aria-label="Page tone">
          {TONES.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={s.tone === t.id} className={s.tone === t.id ? "is-on" : ""} onClick={() => settings.setTone(t.id)}>
              <i className={`swatch swatch--${t.id}`} aria-hidden="true" />
              <strong>{t.label}</strong>
              <small>{t.hint}</small>
            </button>
          ))}
        </div>
        <div className="stepper stepper--dim">
          <span aria-hidden="true">Dim</span>
          <input type="range" min={0.55} max={1} step={0.05} value={s.dim} onChange={(e) => settings.setDim(Number(e.target.value))} aria-label="Page brightness" />
          <span aria-hidden="true">Bright</span>
        </div>
      </div>

      <div className="setting">
        <div className="setting__label">Theme</div>
        <div className="seg" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={s.theme === t.id} className={s.theme === t.id ? "is-on" : ""} onClick={() => settings.setTheme(t.id)}>
              <strong>{t.label}</strong>
              <small>{t.hint}</small>
            </button>
          ))}
        </div>
      </div>

      {s.mode === "flow" && (
        <div className="setting">
          <div className="setting__label">Tap the top or bottom edge to scroll a screen</div>
          <div className="seg seg--tight" role="radiogroup" aria-label="Edge scroll">
            <button type="button" role="radio" aria-checked={s.edgeScroll} className={s.edgeScroll ? "is-on" : ""} onClick={() => settings.setEdgeScroll(true)}>
              On
            </button>
            <button type="button" role="radio" aria-checked={!s.edgeScroll} className={!s.edgeScroll ? "is-on" : ""} onClick={() => settings.setEdgeScroll(false)}>
              Off
            </button>
          </div>
        </div>
      )}

      <div className="setting">
        <div className="setting__label">Auto scroll, seconds on each page</div>
        <div className="seg seg--tight" role="radiogroup" aria-label="Seconds per page">
          {SPEEDS.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={s.seconds === n} className={s.seconds === n ? "is-on" : ""} onClick={() => settings.setSeconds(n)}>
              {n} s
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <div className="setting__label">Auto scroll, at the last page</div>
        <div className="seg seg--tight" role="radiogroup" aria-label="At the last page">
          <button type="button" role="radio" aria-checked={s.loop} className={s.loop ? "is-on" : ""} onClick={() => settings.setLoop(true)}>
            Start over
          </button>
          <button type="button" role="radio" aria-checked={!s.loop} className={!s.loop ? "is-on" : ""} onClick={() => settings.setLoop(false)}>
            Stop
          </button>
        </div>
      </div>

      <div className="setting">
        <div className="setting__label">Daily goal, pages</div>
        <div className="seg seg--tight" role="radiogroup" aria-label="Daily goal">
          {GOALS.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={r.goal === n} className={r.goal === n ? "is-on" : ""} onClick={() => reading.setGoal(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <p className="about">
        {catalog.total} pages. Your place, bookmarks and reading progress are saved on this device. Keys: arrows to move a page, space to play or pause, G to navigate, B to bookmark, F for full screen, plus and minus to resize.
      </p>
    </Sheet>
  );
}
