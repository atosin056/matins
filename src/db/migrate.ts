import { BOOKS } from "@/constants/books";
import type { SQLiteDatabase } from "expo-sqlite";

// Bump this whenever you change the schema, then add a new `if (current === N)` block.
const DB_VERSION = 3;
const VERSE_BATCH_SIZE = 200;

type PackagedVerse = [
  bookId: number,
  chapter: number,
  verse: number,
  text: string,
];

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  let current = row?.user_version ?? 0;

  if (current >= DB_VERSION) return;

  if (current === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE IF NOT EXISTS books (
        id            INTEGER PRIMARY KEY,
        name          TEXT NOT NULL,
        abbrev        TEXT,
        testament     TEXT NOT NULL,
        chapter_count INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS verses (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse   INTEGER NOT NULL,
        text    TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_verses_ref ON verses(book_id, chapter, verse);

      CREATE TABLE IF NOT EXISTS summaries (
        book_id  INTEGER NOT NULL,
        chapter  INTEGER NOT NULL,
        short    TEXT,
        detailed TEXT,
        PRIMARY KEY (book_id, chapter)
      );

      CREATE TABLE IF NOT EXISTS readings (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id     INTEGER NOT NULL,
        chapter     INTEGER NOT NULL,
        verse_start INTEGER,
        verse_end   INTEGER,
        read_at     TEXT NOT NULL DEFAULT (datetime('now')),
        note        TEXT
      );

      CREATE TABLE IF NOT EXISTS prayers (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        reading_id INTEGER NOT NULL,
        text       TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Seed the 66 books from your constants file (runs once).
    await db.withTransactionAsync(async () => {
      for (const b of BOOKS) {
        await db.runAsync(
          "INSERT OR REPLACE INTO books (id, name, testament, chapter_count) VALUES (?, ?, ?, ?)",
          [b.id, b.name, b.testament, b.chapter_count],
        );
      }
    });

    current = 1;
  }

  if (current === 1 || current === 2) {
    const packagedVerses =
      require("@/data/kjv-verses.json") as PackagedVerse[];

    await db.withTransactionAsync(async () => {
      await db.execAsync("DELETE FROM verses");

      for (
        let offset = 0;
        offset < packagedVerses.length;
        offset += VERSE_BATCH_SIZE
      ) {
        const batch = packagedVerses.slice(offset, offset + VERSE_BATCH_SIZE);
        const values = batch.map(() => "(?, ?, ?, ?)").join(", ");
        const params = batch.flatMap(
          ([bookId, chapter, verse, text]) => [bookId, chapter, verse, text],
        );

        await db.runAsync(
          `INSERT INTO verses (book_id, chapter, verse, text) VALUES ${values}`,
          params,
        );
      }
    });

    current = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}
