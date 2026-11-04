# Folia

A mobile first slideshow for the book's page images, in the art direction of [Atramenth](https://atramenth.github.io): flat Slate and Paper themes, Cormorant Garamond with Jost, quiet controls.

Live address after deploy: `https://atramenth.github.io/folia/`

Built with React and TypeScript (object oriented services and controllers), Vite, and GitHub Pages. No runtime dependency besides React.

## What it does

- Swipe to turn pages with a real sliding track, edge resistance and flick momentum
- Pinch, double tap or mouse wheel to zoom, drag to pan
- A page scrubber made for 1,200 pages: drag to travel, slide your finger up while dragging to slow down and land on an exact page. Nothing loads until you let go
- Go to any page number, jump by section, move by 10 or 100, and keep bookmarks
- Slideshow with 3, 5, 8 or 12 seconds per page, with a thin progress line
- Remembers your place, and every page has its own link: `#/p/812`
- Preloads the next two pages and the previous one, and respects the device's Save Data setting
- Slate, Paper or Auto theme, reduced motion support, keyboard control, screen reader labels

Keys: arrows or Page Up and Down turn pages, Space plays or pauses, G goes to a page, B bookmarks, F full screen, 0 resets zoom, Home and End.

## Add the page images

Put every image in one folder, `public/pages/`, named by its printed page number:

```
public/pages/1.avif
public/pages/2.avif
...
public/pages/1196.avif
public/pages/1199.avif      (Introduction, 1199 to 1220)
...
public/pages/1220.avif
public/pages/1221.avif      (Index, 1221 to 1223)
public/pages/1222.avif
public/pages/1223.avif
```

That is 1,221 images. Pages 1197 and 1198 are skipped on purpose. Do not zero pad the names (`1.avif`, not `0001.avif`).

Check what is in place:

```
npm run check:pages          # lists missing and unexpected files
npm run check:pages:strict   # same, but exits with an error if anything is missing
```

The deploy workflow runs the check and prints the result, but it does not stop the site from going live, so you can upload in batches.

### Uploading about 1,200 files

- The GitHub website accepts at most 100 files per upload, so use Git or GitHub Desktop instead.
- Push in a few commits so no single push is huge, for example 300 images at a time.
- Each file must be under 100 MB (yours are far smaller). Plan for roughly 400 to 600 KB per page, about 500 to 700 MB in total. GitHub recommends keeping a repository under 1 GB and a published Pages site is limited to 1 GB, so avoid adding other large files.
- If you need to reduce the size later, lower the image width to about 1600 px. Nothing in the code depends on the image dimensions.

## Develop

```
npm install
npm run dev
```

Open the printed address. Use the `#/p/N` form to start on a page, for example `http://localhost:5173/#/p/812`.

```
npm run build     # type check and production build into dist/
npm run preview   # serve the production build
```

## Deploy

1. Create the repository `atramenth/folia` on GitHub and push this project to the `main` branch.
2. In the repository go to Settings, then Pages, and set Source to **GitHub Actions**.
3. Every push to `main` builds and publishes the site through `.github/workflows/deploy.yml`.

The build uses a relative base path and hash links, so it works under any repository name and needs no 404 redirect. If you rename the repository, nothing in the code has to change.

## Change the page ranges

All ranges live in one place, `src/data/catalog.ts`:

```ts
export const SECTIONS = [
  { id: "book", label: "Book", from: 1, to: 1196 },
  { id: "introduction", label: "Introduction", from: 1199, to: 1220 },
  { id: "index", label: "Index", from: 1221, to: 1223 },
];
```

The scrubber, the Go to sheet, the section label, the preload logic and the file check all follow it.

## Structure

```
src/data        catalog.ts, the sections and page ranges
src/domain      PageCatalog (ordered pages and sections), ScrubModel (scrubbing speed rules)
src/gestures    StageController (swipe, pinch, pan, double tap, wheel)
src/services    Store base class, SettingsStore, ProgressStore, BookmarkStore,
                PageImages (urls and preloading), HashLocation, Slideshow
src/hooks       useStore, useViewer
src/components  Stage, Slide, Scrubber, JumpSheet, SettingsSheet, Sheet, Hint, Icons
src/styles      app.css, all design tokens and layout
scripts         check-pages.ts
public/pages    the page images (you add these)
```
