import { useCallback, useEffect, useRef, useState } from "react";
import { Hint } from "./components/Hint.tsx";
import { IconBookmark, IconFullscreen, IconJump, IconNext, IconPause, IconPlay, IconPrev, IconSettings } from "./components/Icons.tsx";
import { JumpSheet } from "./components/JumpSheet.tsx";
import { Scrubber } from "./components/Scrubber.tsx";
import { SettingsSheet } from "./components/SettingsSheet.tsx";
import { Stage, type StageHandle } from "./components/Stage.tsx";
import type { Direction } from "./domain/types.ts";
import { useStore } from "./hooks/useStore.ts";
import { useViewer } from "./hooks/useViewer.ts";
import { bookmarks } from "./services/BookmarkStore.ts";
import { catalog } from "./services/library.ts";
import { progress } from "./services/ProgressStore.ts";
import { settings } from "./services/SettingsStore.ts";
import { Slideshow } from "./services/Slideshow.ts";

type SheetName = "jump" | "settings" | null;

const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;
const marks = catalog.sectionMarks();
const label = (i: number) => String(catalog.pageAt(i));

export default function App() {
  const s = useStore(settings);
  const saved = useStore(bookmarks).pages;
  const { hintSeen } = useStore(progress);
  const viewer = useViewer(catalog);
  const stage = useRef<StageHandle>(null);

  const [chrome, setChrome] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [playing, setPlaying] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const { index, page, go, goTo } = viewer;
  const shownIndex = preview ?? index;
  const section = catalog.sectionAt(shownIndex);
  const isSaved = saved.includes(page);
  const paused = sheet !== null || zoomed || preview !== null || !hintSeen;
  const running = playing && !paused;

  const turn = useCallback((d: Direction) => {
    stage.current?.slideBy(d);
  }, []);

  const onNavigate = useCallback((d: Direction) => go(d), [go]);
  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p) setChrome(false);
      return !p;
    });
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);

  // Slideshow: one timer per page; paused while a sheet is open, zoomed in, or scrubbing.
  useEffect(() => {
    if (!running) return;
    const show = new Slideshow();
    show.start(s.seconds * 1000, () => {
      if (stage.current?.slideBy(1)) return;
      if (s.loop) goTo(0);
      else setPlaying(false);
    });
    return () => show.stop();
  }, [running, index, s.seconds, s.loop, goTo]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheet || !hintSeen || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          turn(1);
          break;
        case "ArrowLeft":
        case "PageUp":
          turn(-1);
          break;
        case "Home":
          goTo(0);
          break;
        case "End":
          goTo(catalog.lastIndex);
          break;
        case " ":
          togglePlay();
          break;
        case "b":
        case "B":
          bookmarks.toggle(page);
          break;
        case "g":
        case "G":
          setSheet("jump");
          break;
        case "f":
        case "F":
          if (canFullscreen) toggleFullscreen();
          break;
        case "0":
          stage.current?.resetZoom();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, hintSeen, turn, togglePlay, toggleFullscreen, goTo, page]);

  return (
    <div className="viewer" data-chrome={chrome ? "on" : "off"}>
      <Stage catalog={catalog} index={index} handleRef={stage} onNavigate={onNavigate} onTap={() => setChrome((c) => !c)} onZoomChange={setZoomed} />

      <header className="bar bar--top">
        <div className="brand">
          <span className="brand__kicker">Folia</span>
          <span className="brand__section">{section.label}</span>
        </div>
        <div className="bar__actions">
          {canFullscreen && (
            <button type="button" className="icon-btn" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"}>
              <IconFullscreen exit={fullscreen} />
            </button>
          )}
          <button type="button" className="icon-btn" onClick={() => setSheet("jump")} aria-label="Go to a page">
            <IconJump />
          </button>
          <button type="button" className="icon-btn" onClick={() => setSheet("settings")} aria-label="Settings">
            <IconSettings />
          </button>
        </div>
      </header>

      <footer className="bar bar--bottom">
        <div className="bar__inner">
          <Scrubber count={catalog.total} value={index} marks={marks} labelFor={label} onPreview={setPreview} onCommit={goTo} />
          <div className="controls">
            <button type="button" className="icon-btn" onClick={() => turn(-1)} disabled={!catalog.canMove(index, -1)} aria-label="Previous page">
              <IconPrev />
            </button>
            <button type="button" className={`icon-btn${playing ? " is-on" : ""}`} onClick={togglePlay} aria-label={playing ? "Pause slideshow" : "Play slideshow"} aria-pressed={playing}>
              {playing ? <IconPause /> : <IconPlay />}
            </button>
            <button type="button" className="pagepill" onClick={() => setSheet("jump")} aria-label={`Page ${catalog.pageAt(shownIndex)}. Go to a page`}>
              <strong>{catalog.pageAt(shownIndex)}</strong>
              <small>{section.label}</small>
            </button>
            <button type="button" className={`icon-btn${isSaved ? " is-on" : ""}`} onClick={() => bookmarks.toggle(page)} aria-label={isSaved ? "Remove bookmark" : "Bookmark this page"} aria-pressed={isSaved}>
              <IconBookmark filled={isSaved} />
            </button>
            <button type="button" className="icon-btn" onClick={() => turn(1)} disabled={!catalog.canMove(index, 1)} aria-label="Next page">
              <IconNext />
            </button>
          </div>
        </div>
      </footer>

      <div className="mini" aria-hidden="true">
        {page}
      </div>
      {running && <i key={page} className="progress" style={{ animationDuration: `${s.seconds}s` }} />}
      <p className="sr-only" aria-live="polite">
        Page {page}, {section.label}
      </p>

      {sheet === "jump" && <JumpSheet catalog={catalog} index={index} onGo={goTo} onClose={() => setSheet(null)} />}
      {sheet === "settings" && <SettingsSheet catalog={catalog} onClose={() => setSheet(null)} />}
      {!hintSeen && <Hint onClose={() => progress.dismissHint()} />}
    </div>
  );
}
