import type { PageCatalog } from "../domain/PageCatalog.ts";
import { useStore } from "../hooks/useStore.ts";
import { settings, type SlideSeconds, type ThemeChoice } from "../services/SettingsStore.ts";
import { Sheet } from "./Sheet.tsx";

const THEMES: { id: ThemeChoice; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Follows your device" },
  { id: "light", label: "Paper", hint: "Cool ink on soft grey" },
  { id: "dark", label: "Slate", hint: "Bone on near black" },
];

const SPEEDS: SlideSeconds[] = [3, 5, 8, 12];

export function SettingsSheet({ catalog, onClose }: { catalog: PageCatalog; onClose: () => void }) {
  const s = useStore(settings);
  return (
    <Sheet label="Settings" onClose={onClose} header="Settings">
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

      <div className="setting">
        <div className="setting__label">Slideshow, time on each page</div>
        <div className="seg seg--tight" role="radiogroup" aria-label="Seconds per page">
          {SPEEDS.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={s.seconds === n} className={s.seconds === n ? "is-on" : ""} onClick={() => settings.setSeconds(n)}>
              {n} s
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <div className="setting__label">Slideshow, at the last page</div>
        <div className="seg seg--tight" role="radiogroup" aria-label="At the last page">
          <button type="button" role="radio" aria-checked={s.loop} className={s.loop ? "is-on" : ""} onClick={() => settings.setLoop(true)}>
            Start over
          </button>
          <button type="button" role="radio" aria-checked={!s.loop} className={!s.loop ? "is-on" : ""} onClick={() => settings.setLoop(false)}>
            Stop
          </button>
        </div>
      </div>

      <p className="about">
        {catalog.total} pages. Your place and bookmarks are saved on this device. Keys: arrows to turn pages, space to play or pause, G to go to a page, B to bookmark, F for full screen.
      </p>
    </Sheet>
  );
}
