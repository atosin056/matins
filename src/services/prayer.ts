import type { Verse } from "@/db/queries";
import { GoogleGenAI } from "@google/genai";

// Must be a model name your key can actually see. Check with the curl command
// (it lists every model available to your key) if you get a "not found" error.
const MODEL = "gemini-3.5-flash-lite";

const PRAYER_PROMPT = `Write a heartfelt, personal Christian prayer modeled after a specific conversational prayer rhythm, weaving in the message of the provided King James Version (KJV) chapter.

Follow this exact flow naturally without using bullet points, numbered lists, or section headers:
1. Open by declaring "In Jesus' name, in the mighty name of Jesus," and immediately thank God for the grace to sleep and wake up to see a new day.
2. Ask God for clarity, wisdom, and deep understanding as we engage with His Word and navigate life.
3. Reflect on a key truth, lesson, or encouragement directly from the provided scripture passage—staying faithful to the text without inventing promises.
4. Humbly ask for the forgiveness of sins and cleansing.
5. Pray for divine protection, ask God to answer all our secret and open heart desires, lift up family members in prayer, and commit our going out and coming in (our daily movements) into His hands.
6. Seal the prayer respectfully in Jesus' name.

Keep the tone earnest, warm, and natural—not overly theatrical or stiff. Return only the prayer text with no introductory remarks or explanations. Its a family Prayer, so keep it wholesome and appropriate for all ages. Avoid any content that could be considered offensive, inappropriate, or disrespectful and also avoid em-dashes`;

export async function generateChapterPrayer(
  reference: string,
  verses: Verse[],
): Promise<string> {
  // .trim() removes stray spaces or a trailing newline from the .env value
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_GEMINI_API_KEY. Add it to .env and restart Metro with: npx expo start -c",
    );
  }

  // Safe debug: never log the key itself
  console.log(
    `Gemini key loaded (${apiKey.length} chars, starts ${apiKey.slice(0, 4)})`,
  );

  const ai = new GoogleGenAI({ apiKey });

  const chapterText = verses
    .map(({ verse, text }) => `${verse}. ${text}`)
    .join("\n");

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Create a prayer for ${reference}, based on this KJV chapter:\n\n${chapterText}`,
      config: {
        systemInstruction: PRAYER_PROMPT,
        // thinking models count their reasoning toward this limit,
        // so keep it generous or the prayer can come back cut off or empty
        maxOutputTokens: 1024,
      },
    });

    const prayer = response.text?.trim();
    if (!prayer) throw new Error("Gemini returned an empty prayer.");
    return prayer;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Gemini error:", message); // the key is not included here
    throw new Error(`Prayer generation failed: ${message}`);
  }
}
