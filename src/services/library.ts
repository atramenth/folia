import { PAGE_EXTENSION, PAGES_DIR, PARTS, SECTIONS, SURAHS } from "../data/catalog.ts";
import { PageCatalog } from "../domain/PageCatalog.ts";
import { PageImages } from "./PageImages.ts";
import { PageLocation } from "./PageLocation.ts";
import { ReadingStore } from "./ReadingStore.ts";

export const catalog = new PageCatalog(SECTIONS, SURAHS, PARTS);
export const pageImages = new PageImages(import.meta.env.BASE_URL, PAGES_DIR, PAGE_EXTENSION);
export const pageLocation = new PageLocation(import.meta.env.BASE_URL);
export const reading = new ReadingStore();
