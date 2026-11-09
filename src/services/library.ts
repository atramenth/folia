import { CHAPTERS, CHAPTERS_COMPLETE, PAGE_EXTENSION, PAGES_DIR, SECTIONS } from "../data/catalog.ts";
import { PageCatalog } from "../domain/PageCatalog.ts";
import { HashLocation } from "./HashLocation.ts";
import { PageImages } from "./PageImages.ts";
import { ReadingStore } from "./ReadingStore.ts";

export const catalog = new PageCatalog(SECTIONS, CHAPTERS, CHAPTERS_COMPLETE);
export const pageImages = new PageImages(import.meta.env.BASE_URL, PAGES_DIR, PAGE_EXTENSION);
export const hashLocation = new HashLocation();
export const reading = new ReadingStore();
