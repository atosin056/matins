import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const sourceDirectory = process.argv[2];
const outputPath =
  process.argv[3] ?? path.join(projectRoot, "src", "data", "kjv-verses.json");

if (!sourceDirectory) {
  throw new Error(
    "Usage: node scripts/convert-kjv-json.mjs <path-to-Bible-kjv> [output-path]",
  );
}

const constants = await readFile(
  path.join(projectRoot, "src", "constants", "books.ts"),
  "utf8",
);
const books = [...constants.matchAll(/\["([^"]+)",\s*(\d+)\]/g)].map(
  ([, name, chapterCount]) => ({ name, chapterCount: Number(chapterCount) }),
);
const sourceNames = JSON.parse(
  await readFile(path.join(sourceDirectory, "Books.json"), "utf8"),
);
if (
  books.length !== 66 ||
  JSON.stringify(sourceNames) !== JSON.stringify(books.map(({ name }) => name))
) {
  throw new Error("Source book order does not match the app's 66-book order.");
}

const verses = [];
for (let bookIndex = 0; bookIndex < books.length; bookIndex++) {
  const { name, chapterCount } = books[bookIndex];
  const fileName = `${name.replace(/ /g, "")}.json`;
  const sourceBook = JSON.parse(
    await readFile(path.join(sourceDirectory, fileName), "utf8"),
  );
  if (sourceBook.book !== name || sourceBook.chapters.length !== chapterCount) {
    throw new Error(`Unexpected KJV data for ${name}.`);
  }

  for (
    let chapterIndex = 0;
    chapterIndex < sourceBook.chapters.length;
    chapterIndex++
  ) {
    const sourceChapter = sourceBook.chapters[chapterIndex];
    const chapter = Number(sourceChapter.chapter);
    if (chapter !== chapterIndex + 1) {
      throw new Error(`${name}: unexpected chapter number ${sourceChapter.chapter}.`);
    }

    for (
      let verseIndex = 0;
      verseIndex < sourceChapter.verses.length;
      verseIndex++
    ) {
      const sourceVerse = sourceChapter.verses[verseIndex];
      const verse = Number(sourceVerse.verse);
      if (verse !== verseIndex + 1 || !sourceVerse.text) {
        throw new Error(`${name} ${chapter}: unexpected verse ${sourceVerse.verse}.`);
      }
      verses.push([bookIndex + 1, chapter, verse, sourceVerse.text]);
    }
  }
}

if (verses.length !== 31_102) {
  throw new Error(`Expected 31,102 KJV verses, found ${verses.length}.`);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(verses));
console.log(`Wrote ${verses.length} verses to ${outputPath}`);
