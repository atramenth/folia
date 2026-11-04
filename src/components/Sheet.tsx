import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconClose } from "./Icons.tsx";

interface Props {
  label: string;
  onClose: () => void;
  header?: ReactNode;
  children: ReactNode;
}

/** Bottom sheet: backdrop, Esc, drag down on the grabber to close. */
export function Sheet({ label, onClose, header, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [dy, setDy] = useState(0);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="sheet-root">
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        ref={ref}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: startY.current === null ? "transform 0.25s var(--ease-out)" : "none" }}
      >
        <div
          className="sheet__grab"
          onPointerDown={(e) => {
            startY.current = e.clientY;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => startY.current !== null && setDy(Math.max(0, e.clientY - startY.current))}
          onPointerUp={() => {
            const far = dy > 90;
            startY.current = null;
            setDy(0);
            if (far) onClose();
          }}
        >
          <span />
        </div>
        <div className="sheet__head">
          <div className="sheet__title">{header}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}
