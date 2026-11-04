import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PAGE_EXTENSION, PAGES_DIR, SECTIONS } from "../src/data/catalog.ts";
import { PageCatalog } from "../src/domain/PageCatalog.ts";

/**
 * Compares public/pages with the catalog. Prints which page images are missing
 * and which files are not part of the catalog. Add --strict to fail when any are missing.
 */
const strict = process.argv.includes("--strict");
const catalog = new PageCatalog(SECTIONS);
const dir = join(process.cwd(), "public", PAGES_DIR);

function ranges(numbers: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < numbers.length; ) {
    let j = i;
    while (j + 1 < numbers.length && numbers[j + 1] === numbers[j] + 1) j++;
    out.push(i === j ? String(numbers[i]) : `${numbers[i]} to ${numbers[j]}`);
    i = j + 1;
  }
  return out.join(", ");
}

const files = existsSync(dir) ? readdirSync(dir) : [];
const present = new Set(files.filter((f) => f.endsWith(`.${PAGE_EXTENSION}`)).map((f) => Number(f.slice(0, -(PAGE_EXTENSION.length + 1)))));
const missing = catalog.pages.filter((p) => !present.has(p));
const extra = [...present].filter((p) => !catalog.has(p)).sort((a, b) => a - b);

console.log(`Pages in catalog: ${catalog.total}`);
console.log(`Images found:     ${catalog.total - missing.length}`);
if (missing.length) console.log(`Missing (${missing.length}): ${ranges(missing)}`);
if (extra.length) console.log(`Not in catalog, never shown (${extra.length}): ${ranges(extra)}`);
if (!missing.length && !extra.length) console.log("All page images are in place.");
if (strict && missing.length) process.exit(1);
