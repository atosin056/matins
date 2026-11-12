import type { Verse } from "@/db/queries";

const PRAYER_API_URL =
  process.env.EXPO_PUBLIC_PRAYER_API_URL ??
  "https://your-api.example.com/api/prayer";

export async function generateChapterPrayer(
  reference: string,
  verses: Verse[],
): Promise<string> {
  const response = await fetch(PRAYER_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference,
      translation: "KJV",
      chapter: verses.map(({ verse, text }) => ({ verse, text })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Prayer API request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("prayer" in payload) ||
    typeof payload.prayer !== "string" ||
    payload.prayer.trim().length === 0
  ) {
    throw new Error("Prayer API returned an invalid response.");
  }

  return payload.prayer.trim();
}
