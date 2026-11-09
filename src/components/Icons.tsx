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

/** The eight pointed star of two overlapping squares: the mark of the app. */
export const IconStar = ({ size = 22 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M5.6 5.6h12.8v12.8H5.6zM12 2.95l9.05 9.05L12 21.05 2.95 12z" />
  </Svg>
);
export const IconMap = () => (
  <Svg>
    <path d="M5 5h3.5v3.5H5zM10.25 5h3.5v3.5h-3.5zM15.5 5H19v3.5h-3.5zM5 10.25h3.5v3.5H5zM10.25 10.25h3.5v3.5h-3.5zM15.5 10.25H19v3.5h-3.5zM5 15.5h3.5V19H5zM10.25 15.5h3.5V19h-3.5z" />
  </Svg>
);
export const IconList = () => (
  <Svg>
    <path d="M9 6.5h10.5M9 12h10.5M9 17.5h10.5" />
    <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" strokeWidth="2.4" />
  </Svg>
);
export const IconDisplay = () => (
  <Svg>
    <path d="M3.5 18.5 8 6.5l4.5 12M5 14.5h6" />
    <path d="M14.5 18.5l3-8 3 8M15.5 16h4" />
  </Svg>
);
export const IconReturn = () => (
  <Svg size={18}>
    <path d="M9 4.5 4.5 9 9 13.5" />
    <path d="M5 9h9.5a5 5 0 0 1 0 10H11" />
  </Svg>
);
export const IconScroll = () => (
  <Svg>
    <path d="M8 3.5h8M8 20.5h8M12 6.5v11M9 14.5l3 3 3-3M9 9.5l3-3 3 3" />
  </Svg>
);
export const IconPages = () => (
  <Svg>
    <path d="M7 4.5h10a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />
    <path d="M9.5 9h5M9.5 12.5h5" />
  </Svg>
);
export const IconCheck = () => (
  <Svg size={16}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const IconPlus = () => (
  <Svg>
    <path d="M12 5.5v13M5.5 12h13" />
  </Svg>
);
export const IconMinus = () => (
  <Svg>
    <path d="M5.5 12h13" />
  </Svg>
);
export const IconSearch = () => (
  <Svg>
    <circle cx="11" cy="11" r="6" />
    <path d="m15.5 15.5 4 4" />
  </Svg>
);
export const IconTrash = () => (
  <Svg size={18}>
    <path d="M5 7h14M10 7V5h4v2M7.5 7l.7 12h7.6l.7-12" />
  </Svg>
);
