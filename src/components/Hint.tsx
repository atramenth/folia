import type { ReactNode } from "react";
import { IconPinch, IconScrub, IconSwipe, IconTap } from "./Icons.tsx";

const ROWS: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <IconSwipe />, title: "Swipe", text: "Left or right to turn the page." },
  { icon: <IconPinch />, title: "Pinch or double tap", text: "To zoom in. Drag to move around." },
  { icon: <IconTap />, title: "Tap once", text: "To hide or show the controls." },
  { icon: <IconScrub />, title: "Drag the bar", text: "To travel far. Slide up to slow down." },
];

/** First run guide. Any tap dismisses it. */
export function Hint({ onClose }: { onClose: () => void }) {
  return (
    <div className="hint" role="dialog" aria-modal="true" aria-label="How to use Folia" onClick={onClose}>
      <div className="hint__card">
        <h2>Folia</h2>
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
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Start reading
        </button>
      </div>
    </div>
  );
}
