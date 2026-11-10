<div align="center">

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="assets/banner.webp">
  <img src="assets/banner.webp" width="100%" alt="Folia: a scanned book, read page by page in a quiet mobile reader. A quiet mobile reader for scanned book pages."/>
</picture>

<br/>

<img src="assets/badges/mobile-first.svg" height="32" alt="Mobile first"/>
<img src="assets/badges/themes.svg" height="32" alt="Slate and Paper themes"/>
<img src="assets/badges/github-pages.svg" height="32" alt="GitHub Pages"/>

<br/>

<a href="https://react.dev"><img src="assets/badges/react.svg" height="32" alt="React"/></a>
<a href="https://www.typescriptlang.org"><img src="assets/badges/typescript.svg" height="32" alt="TypeScript"/></a>
<a href="https://vite.dev"><img src="assets/badges/vite.svg" height="32" alt="Vite"/></a>
<img src="assets/badges/node.svg" height="32" alt="Node.js"/>

<br/>

<img src="assets/badges/accessibility.svg" height="32" alt="Accessibility"/>
<img src="assets/badges/deep-links.svg" height="32" alt="Deep links"/>
<img src="assets/badges/no-backend.svg" height="32" alt="No backend"/>

<br/><br/>

*A quiet, mobile-first way to read a book as it was printed: one scanned page at a time.*

<br/>

[Overview](#overview) · [Reading](#reading) · [Features](#features) · [Architecture](#architecture) · [Pages](#page-images) · [Design](#design) · [Getting started](#getting-started) · [Deployment](#deployment)

</div>

---

<a id="overview"></a>
## <img src="assets/icons/book.svg" width="24" height="24" align="absmiddle" alt=""/> Overview

**Folia** is Atramenth’s sister project for a book that lives in its scanned pages. Where Atramenth presents the printed text as a digital reader, Folia lets the original page images speak for themselves: paper, ink, margins and all.

The viewer is built to read slowly and comfortably:

- **Page by page.** Open a scan and move through the book with a real sliding track.
- **Made for touch.** Swipe to turn; pinch or double tap to zoom; drag to inspect a page.
- **Quiet by design.** Slate and Paper themes, Cormorant Garamond with Jost, and controls that stay out of the way.
- **Your place stays yours.** No account or backend. Folia remembers progress and bookmarks on the device.

The live site will be [atramenth.github.io/folia](https://atramenth.github.io/folia/) after deployment.

![Folia reading flow](assets/folio.svg)

---

<a id="reading"></a>
## <img src="assets/icons/phone.svg" width="24" height="24" align="absmiddle" alt=""/> Reading

Folia opens as one continuous column: the whole book scrolls like a single long page, with the printed number set on a hairline between pages. A second mode, Pages, turns one scan at a time with a swipe. Choose in **Display**.

| Action | How |
|---|---|
| Read on | Scroll. Optional: in Display, turn on edge scroll to move a screen by tapping the top or bottom edge |
| Hide or show the controls | Tap the middle of the page. They also tuck away as you scroll down and return as you scroll up |
| Make the page larger | Pinch, double tap, or use the size slider in Display. The size is remembered from page to page |
| Travel far | Grab the gilt handle on the right edge and drag. Only the handle reacts, so scrolling near the edge is safe. A large page number follows your thumb; slide left to slow down |
| Jump anywhere | Open the **Index** (the grid button): one search box for a sūrah name, sūrah number or page, then Surahs, Parts, the page Map and your Marks |
| Come back | After a long jump, a **Back to page** chip stays for a few seconds |
| Bookmark | The bookmark button, or **B**. Add a short note in Navigate, Marks |
| Night reading | Display, Page tone: Original, Warm or Night, plus a brightness control |
| Auto scroll | Play. Choose 3, 5, 8 or 12 seconds per page. Touch the screen to stop |
| Keys | Arrows move a page, Page Up and Page Down move a screen, space plays, G navigates, B bookmarks, F full screen, plus and minus resize, 0 fits to width |

Each page has its own clean address, such as `/folia/p/812`, with no `#`. Folia restores the last reading position when you return. Older `#/p/812` links still work and are rewritten on arrival. Turn a phone sideways for the widest page.

---

<a id="features"></a>
## <img src="assets/icons/spark.svg" width="24" height="24" align="absmiddle" alt=""/> Features

- Continuous reader that only keeps the pages near the screen in the document, so 1,200 pages stay light
- Pinch, double tap, ctrl wheel and slider zoom that keeps the point under your fingers in place, with a remembered size
- Edge scrubber with a ruler of the 30 parts, gilt ticks for the Introduction and Index, bookmark dots, and a slow-down gesture for exact landing
- Index of all 114 sūrahs (name, place, āyāt, parts, page) and the 30 parts, with search by name, number, page or "part 5"
- Page map: every page as a square in bands of a hundred, read pages filled, current page in gilt, bookmarks dotted
- Reading progress: pages count as read after a moment in view; progress ring, pages today, day streak and a daily goal
- Bookmarks with notes, and a way back after a long jump
- Page tones (Original, Warm, Night) and brightness for reading at any hour
- Pages mode with swipe, momentum, pinch, double tap and edge taps
- Auto scroll or slideshow at 3, 5, 8 or 12 seconds per page
- Clean deep links, saved position, Slate, Paper and Auto themes
- Reduced motion, keyboard controls, screen reader labels

---

<a id="architecture"></a>
## <img src="assets/icons/layers.svg" width="24" height="24" align="absmiddle" alt=""/> Architecture

![Folia architecture](assets/architecture.svg)

Folia is built with React and TypeScript, using object-oriented services and controllers. Vite produces a static site for GitHub Pages; at runtime the only library dependency is React.

- **Catalog:** `src/data/catalog.ts` defines the ordered sections and printed page ranges. The viewer, section labels, scrubber, jump sheet and page check share this source.
- **Reader:** `Flow` is the continuous column (CSS variable layout, windowed pages, native scrolling, pinch and double tap). `Stage` and `StageController` handle Pages mode. `ScrubModel` controls precision while scrubbing.
- **Services:** Stores persist settings, progress, bookmarks (with notes) and reading history (`ReadingStore`). `PageImages` resolves image URLs and preloads nearby pages; `PageLocation` keeps the address bar on the current page; `Slideshow` advances on a timer.
- **Interface:** `Flow`, `Stage`, `Scrubber` (the edge rail), `JumpSheet` (Navigate, with `PageMap`), `SettingsSheet` (Display) and the welcome screen in `Hint` make up the reader.

---

<a id="page-images"></a>
## <img src="assets/icons/folder.svg" width="24" height="24" align="absmiddle" alt=""/> Page images

The book contains 1,221 page images, named by printed page number. The configured sections are:

| Section | Printed pages |
|---|---:|
| Book | 1–1196 |
| Introduction | 1199–1220 |
| Index | 1221–1223 |

Pages 1197 and 1198 are intentionally absent. The page catalog expects filenames in the form `1.avif`, `2.avif`, and so on, without zero padding. The page checker reports missing or unexpected files; strict mode also exits with an error when files are missing.

```bash
npm run check:pages
npm run check:pages:strict
```

---

<a id="design"></a>
## <img src="assets/icons/palette.svg" width="24" height="24" align="absmiddle" alt=""/> Design

![Atramenth design system](assets/design-system.svg)

Folia shares Atramenth’s restrained visual language: flat Slate and Paper themes, measured typography and quiet controls. Cormorant Garamond carries the editorial character; Jost keeps interface labels clear. One accent, gilt, marks only where you are, what you kept and how far you have come. The eight pointed star of two overlapping squares is the mark of the app. The page scan remains the focus.

Styles are split by concern in `src/styles/`: `tokens.css`, `base.css`, `reader.css`, `chrome.css` and `sheets.css`, gathered by `app.css`.

### Index data

`src/data/catalog.ts` holds the three sections (Qur'ān, Introduction, Index), the 114 sūrahs and the 30 parts. The sūrah names, places, āyah counts and first pages come from the main site (atramenth.github.io). Part starts are given there as (sūrah, āyah); their page numbers here are exact wherever the main site has the sūrah text and are marked `about: true` for the five whose sūrah is not added there yet (parts 12, 13, 16, 19 and 20). Correct those five from the printed book if they are a page off.

---

<a id="accessibility"></a>
## <img src="assets/icons/access.svg" width="24" height="24" align="absmiddle" alt=""/> Accessibility and privacy

- Keyboard controls cover page turns, slideshow, page navigation, bookmarks, zoom and full screen.
- Screen-reader labels identify controls and reading state.
- Reduced-motion preferences are respected.
- The current page, bookmarks, settings and progress are stored locally on the device.
- No account or backend is required.

---

<a id="getting-started"></a>
## <img src="assets/icons/terminal.svg" width="24" height="24" align="absmiddle" alt=""/> Getting started

**Requirements:** Node.js and npm.

```bash
npm install
npm run dev
```

Open the local address printed by Vite. To start at a page, open a path such as `http://localhost:5173/folia/p/812`.

```bash
npm run check:pages   # report missing or unexpected page images
npm run build         # type check and production build into dist/
npm run preview       # serve the production build locally
```

---

<a id="deployment"></a>
## <img src="assets/icons/cloud.svg" width="24" height="24" align="absmiddle" alt=""/> Deployment

![GitHub Pages deployment](assets/deploy.svg)

The project is published at **https://atramenth.github.io/folia/** through `.github/workflows/deploy.yml`. Push to `main` to build and publish with GitHub Actions. In repository settings, choose **Settings → Pages → Build and deployment → GitHub Actions** as the source.

Page links are plain paths such as `/folia/p/812`. The Vite base is `/folia/` (set `VITE_BASE` to change it) and the build copies `index.html` to `404.html`, which GitHub Pages serves for any unknown path, so every link opens the app on its page.

---

<a id="structure"></a>
## <img src="assets/icons/folder.svg" width="24" height="24" align="absmiddle" alt=""/> Project structure

```
folia/
├── assets/                  README artwork, badges and diagrams
├── public/pages/            Scanned book pages, named by printed page number
├── scripts/check-pages.ts   Reports missing and unexpected page images
├── src/
│   ├── data/catalog.ts      Sections, 114 sūrahs, 30 parts and printed pages
│   ├── domain/              PageCatalog and ScrubModel
│   ├── gestures/            StageController
│   ├── services/            Stores, page images, page location and slideshow
│   ├── hooks/               useStore and useViewer
│   ├── components/          Flow, Stage, Scrubber, Navigate, Display and welcome
│   └── styles/              Tokens, base, reader, chrome and sheets stylesheets
├── .github/workflows/       GitHub Pages deployment
├── index.html
├── package.json
└── vite.config.ts
```

---

<div align="center">

<img src="assets/footer.svg" width="640" alt="Atramenth: a quiet reader in Slate and Paper."/>

</div>


