import { useCallback, useEffect, useState } from "react";
import type { PageCatalog } from "../domain/PageCatalog.ts";
import { hashLocation, pageImages } from "../services/library.ts";
import { progress } from "../services/ProgressStore.ts";

/** Which page is showing: starts from the link, else the saved place, else page 1. */
export function useViewer(catalog: PageCatalog) {
  const [index, setIndex] = useState(() => {
    const linked = hashLocation.read();
    if (linked !== null) return catalog.nearestIndex(linked);
    const saved = progress.getSnapshot().page;
    return saved > 0 ? catalog.nearestIndex(saved) : 0;
  });

  useEffect(() => {
    const page = catalog.pageAt(index);
    progress.setPage(page);
    hashLocation.write(page);
    // Warm the pages most likely to be wanted next: two ahead, one behind.
    pageImages.preload([catalog.pageAt(index + 1), catalog.pageAt(index + 2), catalog.pageAt(index - 1)]);
  }, [index, catalog]);

  useEffect(() => hashLocation.subscribe((page) => setIndex(catalog.nearestIndex(page))), [catalog]);

  const goTo = useCallback((i: number) => setIndex(catalog.clamp(i)), [catalog]);
  const go = useCallback((delta: number) => setIndex((i) => catalog.clamp(i + delta)), [catalog]);

  return { index, page: catalog.pageAt(index), goTo, go };
}
