import type { SQLiteDatabase } from "expo-sqlite";

export type Book = {
  id: number;
  name: string;
  testament: "OT" | "NT";
  chapter_count: number;
};

export type Verse = {
  verse: number;
  text: string;
};

export function getBooks(db: SQLiteDatabase) {
  return db.getAllAsync<Book>(
    "SELECT id, name, testament, chapter_count FROM books ORDER BY id",
  );
}

export function getBook(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Book>(
    "SELECT id, name, testament, chapter_count FROM books WHERE id = ?",
    [id],
  );
}

// Used by the Reader screen to load a chapter from the bundled KJV text.
export function getVerses(db: SQLiteDatabase, bookId: number, chapter: number) {
  return db.getAllAsync<Verse>(
    "SELECT verse, text FROM verses WHERE book_id = ? AND chapter = ? ORDER BY verse",
    [bookId, chapter],
  );
}
