import type { Book } from "@/db/queries";

type BibleReference = {
  bookId: number;
  chapter: number;
};

const smallNumbers: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const tensNumbers: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

function parseChapterNumber(value: string) {
  if (/^\d+$/.test(value)) return Number(value);

  let current = 0;
  for (const word of value.split(" ")) {
    if (word === "and") continue;
    if (Object.prototype.hasOwnProperty.call(smallNumbers, word)) {
      current += smallNumbers[word];
    } else if (Object.prototype.hasOwnProperty.call(tensNumbers, word)) {
      current += tensNumbers[word];
    } else if (word === "hundred") {
      current = Math.max(current, 1) * 100;
    } else {
      return null;
    }
  }

  return current > 0 ? current : null;
}

function bookAliases(name: string) {
  const normalized = name.toLowerCase();
  const numberedBook = /^([1-3]) (.+)$/.exec(normalized);
  if (!numberedBook) return [normalized];

  const [, number, rest] = numberedBook;
  const words: Record<string, string> = {
    "1": "first",
    "2": "second",
    "3": "third",
  };
  const suffix = number === "1" ? "st" : number === "2" ? "nd" : "rd";
  const word = words[number];
  return [
    normalized,
    `${number}${suffix} ${rest}`,
    `${word} ${rest}`,
    `${number === "1" ? "one" : number === "2" ? "two" : "three"} ${rest}`,
  ];
}

export function parseBibleReference(
  input: string,
  books: Book[],
): BibleReference | null {
  let normalized = input
    .toLowerCase()
    .replace(/[.,!?;:]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  normalized = normalized.replace(
    /^(?:(?:please|can you|open|read|go to|take me to|show me|find)\s+)+/,
    "",
  );

  const candidates = books
    .flatMap((book) =>
      bookAliases(book.name).map((alias) => ({ book, alias })),
    )
    .sort((a, b) => b.alias.length - a.alias.length);

  for (const { book, alias } of candidates) {
    const prefix = `${alias} `;
    if (!normalized.startsWith(prefix)) continue;

    const chapterText = normalized
      .slice(prefix.length)
      .replace(/^chapter\s+/, "")
      .trim();
    const chapter = parseChapterNumber(chapterText);
    if (chapter !== null) return { bookId: book.id, chapter };
  }

  return null;
}
