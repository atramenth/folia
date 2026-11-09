import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flow, type FlowHandle } from "./components/Flow.tsx";
import { Hint } from "./components/Hint.tsx";
import { IconBookmark, IconDisplay, IconFullscreen, IconMap, IconPause, IconPlay, IconReturn, IconStar } from "./components/Icons.tsx";
import { JumpSheet, type NavTab } from "./components/JumpSheet.tsx";
import { Scrubber } from "./components/Scrubber.tsx";
import { SettingsSheet } from "./components/SettingsSheet.tsx";
import { Stage, type StageHandle } from "./components/Stage.tsx";
import type { Direction, TapZone } from "./domain/types.ts";
import { useStore } from "./hooks/useStore.ts";
import { useViewer } from "./hooks/useViewer.ts";
import { bookmarks } from "./services/BookmarkStore.ts";
import { catalog, hashLocation, reading } from "./services/library.ts";
import { progress } from "./services/ProgressStore.ts";
import { settings } from "./services/SettingsStore.ts";
import { Slideshow } from "./services/Slideshow.ts";

type SheetName = "nav" | "display" | null;

const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;
const sectionMarks = catalog.sectionMarks();
const chapterMarks = catalog.chapterMarks();
const label = (i: number) => String(catalog.pageAt(i));
const caption = (i: number) => catalog.chapterAt(i)?.title ?? catalog.sectionAt(i).label;

/** How long a page must stay in view before it counts as read. */
const READ_AFTER_MS = 2500;
/** A jump this many pages or further offers a way back. */
const FAR = 3;
const BACK_CHIP_MS = 16000;

export default function App() {
  const s = useStore(settings);
  const saved = useStore(bookmarks).pages;
  const { hintSeen } = useStore(progress);
  const viewer = useViewer(catalog);
  const flow = useRef<FlowHandle>(null);
  const stage = useRef<StageHandle>(null);
  const root = useRef<HTMLDivElement>(null);

  const [chrome, setChrome] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [navTab, setNavTab] = useState<NavTab>("map");
  const [playing, setPlaying] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [origin, setOrigin] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { index, page, goTo } = viewer;
  const mode = s.mode;
  const shownIndex = preview ?? index;
  const section = catalog.sectionAt(shownIndex);
  const chapter = catalog.chapterAt(shownIndex);
  const isSaved = saved.includes(page);
  const savedIndexes = useMemo(() => saved.map((p) => catalog.nearestIndex(p)), [saved]);
  const paused = sheet !== null || (mode === "pages" && zoomed) || preview !== null || !hintSeen;
  const running = playing && !paused;

  // Latest values for callbacks that must stay stable.
  const live = useRef({ index, mode, s });
  live.current = { index, mode, s };

  /** Move to a page. Far, deliberate jumps remember where you were so you can come back. */
  const navigate = useCallback(
    (i: number, deliberate = true) => {
      const target = catalog.clamp(i);
      const from = live.current.index;
      if (deliberate && Math.abs(target - from) >= FAR) setOrigin(from);
      if (live.current.mode === "flow") {
        flow.current?.scrollToIndex(target);
        // After a deliberate jump the page should have the whole screen.
        if (deliberate) setChrome(false);
      }
      goTo(target);
    },
    [goTo],
  );

  /** One page forward or back, with the page animation. */
  const step = useCallback(
    (d: Direction) => {
      if (live.current.mode === "flow") navigate(live.current.index + d, false);
      else stage.current?.slideBy(d);
    },
    [navigate],
  );

  const openNav = useCallback((tab: NavTab = "map") => {
    setNavTab(tab);
    setSheet("nav");
  }, []);

  const closeSheet = useCallback(() => setSheet(null), []);

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

  const toggleBookmark = useCallback(() => {
    const p = catalog.pageAt(live.current.index);
    const had = bookmarks.has(p);
    bookmarks.toggle(p);
    setToast(had ? `Bookmark removed from page ${p}` : `Bookmarked page ${p}`);
  }, []);

  const onTap = useCallback(
    (zone: TapZone) => {
      if (live.current.mode === "flow") {
        // Edge scrolling is opt in: by default a tap only shows or hides the controls.
        if (zone === "start") flow.current?.scrollScreen(-1);
        else if (zone === "end") flow.current?.scrollScreen(1);
        else setChrome((c) => !c);
        return;
      }
      if (zone === "start") step(-1);
      else if (zone === "end") step(1);
      else setChrome((c) => !c);
    },
    [step],
  );

  const onScrollDirection = useCallback((d: "up" | "down") => {
    setChrome(d === "up");
  }, []);

  // A link changed the page (the address bar, a bookmark on another device).
  useEffect(() => hashLocation.subscribe((p) => navigate(catalog.nearestIndex(p), false)), [navigate]);

  // Pages mode shows its place on the rail directly; the continuous reader updates it as it scrolls.
  useEffect(() => {
    if (mode === "pages") root.current?.style.setProperty("--frac", String(catalog.fraction(index)));
  }, [mode, index]);

  useEffect(() => {
    if (mode !== "pages") setZoomed(false);
  }, [mode]);

  // Slideshow in pages mode: one timer per page.
  useEffect(() => {
    if (!running || mode !== "pages") return;
    const show = new Slideshow();
    show.start(s.seconds * 1000, () => {
      if (stage.current?.slideBy(1)) return;
      if (s.loop) goTo(0);
      else setPlaying(false);
    });
    return () => show.stop();
  }, [running, mode, index, s.seconds, s.loop, goTo]);

  // Auto scroll in the continuous reader: a steady drift, a page every few seconds.
  useEffect(() => {
    const f = flow.current;
    if (!f) return;
    if (!running || mode !== "flow") {
      f.autoScroll(0);
      return;
    }
    f.autoScroll(f.pxPerPage() / s.seconds);
    return () => f.autoScroll(0);
  }, [running, mode, s.seconds, s.zoom]);

  const onAutoEnd = useCallback(() => {
    if (live.current.s.loop) {
      navigate(0, false);
      requestAnimationFrame(() => {
        const f = flow.current;
        f?.autoScroll(f.pxPerPage() / live.current.s.seconds);
      });
    } else setPlaying(false);
  }, [navigate]);

  // A page counts as read when it has been on screen for a moment.
  useEffect(() => {
    if (!hintSeen || sheet) return;
    const t = window.setTimeout(() => reading.markRead(page), READ_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [page, hintSeen, sheet]);

  // The way back chip fades after a while, and is not needed once you are near where you were.
  useEffect(() => {
    if (origin === null) return;
    const t = window.setTimeout(() => setOrigin(null), BACK_CHIP_MS);
    return () => window.clearTimeout(t);
  }, [origin]);

  useEffect(() => {
    if (toast === null) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    document.title = `Page ${page} | Folia`;
  }, [page]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheet || !hintSeen || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest("input, textarea, [role=slider]")) return;
      const flowing = live.current.mode === "flow";
      switch (e.key) {
        case "ArrowRight":
          step(1);
          break;
        case "ArrowLeft":
          step(-1);
          break;
        case "PageDown":
          if (flowing) flow.current?.scrollScreen(1);
          else step(1);
          break;
        case "PageUp":
          if (flowing) flow.current?.scrollScreen(-1);
          else step(-1);
          break;
        case "Home":
          navigate(0, false);
          break;
        case "End":
          navigate(catalog.lastIndex, false);
          break;
        case " ":
          togglePlay();
          break;
        case "b":
        case "B":
          toggleBookmark();
          break;
        case "g":
        case "G":
          openNav("map");
          break;
        case "f":
        case "F":
          if (canFullscreen) toggleFullscreen();
          break;
        case "+":
        case "=":
          if (flowing) flow.current?.zoomTo(live.current.s.zoom + 0.25);
          break;
        case "-":
          if (flowing) flow.current?.zoomTo(live.current.s.zoom - 0.25);
          break;
        case "0":
          if (flowing) flow.current?.zoomTo(1);
          else stage.current?.resetZoom();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, hintSeen, step, navigate, togglePlay, toggleBookmark, openNav, toggleFullscreen]);

  const headline = chapter ? chapter.title : section.label;
  const kicker = chapter?.sub ?? (chapter ? section.label : "Folia");
  const percent = Math.round(catalog.fraction(shownIndex) * 100);
  const showBack = origin !== null && Math.abs(index - origin) >= FAR && sheet === null;

  return (
    <div className="viewer" ref={root} data-chrome={chrome ? "on" : "off"} data-mode={mode} data-playing={running ? "true" : "false"}>
      {mode === "flow" ? (
        <Flow
          key="flow"
          catalog={catalog}
          initialIndex={index}
          zoom={s.zoom}
          readZoom={s.readZoom}
          edgeTaps={s.edgeScroll}
          onIndex={goTo}
          onTap={onTap}
          onScrollDirection={onScrollDirection}
          onZoom={settings.setZoom.bind(settings)}
          onAutoEnd={onAutoEnd}
          onAutoStop={() => setPlaying(false)}
          handleRef={flow}
        />
      ) : (
        <Stage key="stage" catalog={catalog} index={index} handleRef={stage} onNavigate={viewer.go} onTap={onTap} onZoomChange={setZoomed} />
      )}

      <i className="hairline" aria-hidden="true" />

      <header className="bar bar--top">
        <button type="button" className="brand" onClick={() => openNav("contents")} aria-label={`${headline}. Open contents`}>
          <span className="brand__mark" aria-hidden="true">
            <IconStar size={26} />
          </span>
          <span className="brand__text">
            <span className="brand__kicker">{kicker}</span>
            <span className="brand__title">{headline}</span>
          </span>
        </button>
        <div className="bar__actions">
          {canFullscreen && (
            <button type="button" className="icon-btn" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"}>
              <IconFullscreen exit={fullscreen} />
            </button>
          )}
          <button type="button" className="icon-btn" onClick={() => setSheet("display")} aria-label="Display and reading settings">
            <IconDisplay />
          </button>
        </div>
      </header>

      <Scrubber
        count={catalog.total}
        value={index}
        sections={sectionMarks}
        chapters={chapterMarks}
        saved={savedIndexes}
        labelFor={label}
        captionFor={caption}
        onPreview={setPreview}
        onCommit={navigate}
      />

      <div className="dockwrap">
        <nav className="dock" aria-label="Reading controls">
          <button type="button" className="icon-btn" onClick={() => openNav("map")} aria-label="Navigate: map, contents and bookmarks">
            <IconMap />
          </button>
          <button type="button" className="readout" onClick={() => openNav("map")} aria-label={`Page ${catalog.pageAt(shownIndex)}. Open the book map`}>
            <strong>{catalog.pageAt(shownIndex)}</strong>
            <small>
              of {catalog.lastPage.toLocaleString("en-US")} <span aria-hidden="true">·</span> {percent}%
            </small>
          </button>
          <button type="button" className={`icon-btn${isSaved ? " is-on" : ""}`} onClick={toggleBookmark} aria-label={isSaved ? "Remove bookmark" : "Bookmark this page"} aria-pressed={isSaved}>
            <IconBookmark filled={isSaved} />
          </button>
          <button type="button" className={`icon-btn${playing ? " is-on" : ""}`} onClick={togglePlay} aria-label={playing ? "Pause auto scroll" : "Start auto scroll"} aria-pressed={playing}>
            {playing ? <IconPause /> : <IconPlay />}
          </button>
        </nav>
      </div>

      <div className="mini" aria-hidden="true">
        {page}
      </div>

      {showBack && (
        <button type="button" className="chip" onClick={() => {
          const back = origin;
          setOrigin(index);
          navigate(back, false);
        }}>
          <IconReturn /> Back to page {catalog.pageAt(origin)}
        </button>
      )}

      {toast && (
        <p className="toast" role="status">
          {toast}
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        Page {page}, {chapter ? `${chapter.title}, ` : ""}
        {section.label}
      </p>

      {sheet === "nav" && <JumpSheet catalog={catalog} index={index} onGo={(i) => navigate(i)} onClose={closeSheet} initialTab={navTab} />}
      {sheet === "display" && <SettingsSheet catalog={catalog} onClose={closeSheet} />}
      {!hintSeen && <Hint total={catalog.total} onClose={() => progress.dismissHint()} />}
    </div>
  );
}
