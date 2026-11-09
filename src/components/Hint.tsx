import { useEffect, useRef, type ReactNode } from "react";
import { IconPinch, IconScrub, IconStar, IconSwipe, IconTap } from "./Icons.tsx";

const ROWS: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <IconSwipe />, title: "Scroll", text: "The whole book is one long column. Just keep reading." },
  { icon: <IconPinch />, title: "Pinch or double tap", text: "Make the page larger. Your size is remembered." },
  { icon: <IconTap />, title: "Tap the middle", text: "Hides or shows the controls. Top and bottom edges move on." },
  { icon: <IconScrub />, title: "Drag the edge line", text: "Travel far in a moment, or open the map to jump anywhere." },
];

/** First run welcome. */
export function Hint({ onClose, total }: { onClose: () => void; total: number }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    button.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-label="Welcome to Folia">
      <div className="welcome__inner">
        <div className="welcome__mark" aria-hidden="true">
          <IconStar size={72} />
        </div>
        <h1>Folia</h1>
        <p className="welcome__lede">
          {total.toLocaleString("en-US")} pages, read as they were printed. <em>Quietly.</em>
        </p>
        <ul>
          {ROWS.map((r) => (
            <li key={r.title}>
              <span className="hint__icon">{r.icon}</span>
              <span>
                <strong>{r.title}</strong>
                <small>{r.text}</small>
              </span>
            </li>
          ))}
        </ul>
        <button ref={button} type="button" className="btn btn--primary btn--wide" onClick={onClose}>
          Begin reading
        </button>
      </div>
    </div>
  );
}
