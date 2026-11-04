import type { ReactNode } from "react";

function Svg({ children, size = 22 }: { children: ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconPrev = () => (
  <Svg>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Svg>
);
export const IconNext = () => (
  <Svg>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </Svg>
);
export const IconPlay = () => (
  <Svg>
    <path d="M8 5.5v13l10.5-6.5z" />
  </Svg>
);
export const IconPause = () => (
  <Svg>
    <path d="M8.5 5.5v13M15.5 5.5v13" />
  </Svg>
);
export const IconBookmark = ({ filled = false }: { filled?: boolean }) => (
  <Svg>
    <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-4.2L6 20V5.5a1 1 0 0 1 1-1z" fill={filled ? "currentColor" : "none"} />
  </Svg>
);
export const IconJump = () => (
  <Svg>
    <path d="M9.5 4 8 20M16 4l-1.5 16M5 9h15M4 15h15" />
  </Svg>
);
export const IconSettings = () => (
  <Svg>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Svg>
);
export const IconClose = () => (
  <Svg>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Svg>
);
export const IconFullscreen = ({ exit = false }: { exit?: boolean }) => (
  <Svg>
    {exit ? <path d="M9 4.5V9H4.5M15 4.5V9h4.5M9 19.5V15H4.5M15 19.5V15h4.5" /> : <path d="M4.5 9V4.5H9M19.5 9V4.5H15M4.5 15v4.5H9M19.5 15v4.5H15" />}
  </Svg>
);
export const IconSwipe = () => (
  <Svg size={26}>
    <path d="M4 12h16M7.5 8.5 4 12l3.5 3.5M16.5 8.5 20 12l-3.5 3.5" />
  </Svg>
);
export const IconPinch = () => (
  <Svg size={26}>
    <path d="M5 19l5-5M19 5l-5 5M5 14.5V19h4.5M19 9.5V5h-4.5" />
  </Svg>
);
export const IconTap = () => (
  <Svg size={26}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="7.5" strokeDasharray="1 2.6" />
  </Svg>
);
export const IconScrub = () => (
  <Svg size={26}>
    <path d="M3.5 12h17" />
    <circle cx="14" cy="12" r="3" fill="currentColor" />
  </Svg>
);
