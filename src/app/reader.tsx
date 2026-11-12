import { getBook, getVerses } from "@/db/queries";
import type { Book, Verse } from "@/db/queries";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReaderLoadResult =
  | { key: string; book: Book; verses: Verse[] }
  | { key: string; error: string };

export default function Reader() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { bookId: bookIdParam, chapter: chapterParam } =
    useLocalSearchParams<{ bookId?: string; chapter?: string }>();
  const bookId = Number(bookIdParam);
  const chapter = Number(chapterParam);
  const validReference =
    Number.isInteger(bookId) &&
    bookId > 0 &&
    Number.isInteger(chapter) &&
    chapter > 0;
  const referenceKey = `${bookId}:${chapter}`;
  const [result, setResult] = useState<ReaderLoadResult | null>(null);

  useEffect(() => {
    if (!validReference) return;

    let active = true;
    Promise.all([getBook(db, bookId), getVerses(db, bookId, chapter)])
      .then(([foundBook, rows]) => {
        if (!active) return;
        if (!foundBook || chapter > foundBook.chapter_count || rows.length === 0) {
          setResult({ key: referenceKey, error: "Couldn't find that chapter." });
          return;
        }
        setResult({ key: referenceKey, book: foundBook, verses: rows });
      })
      .catch((reason: unknown) => {
        console.error("Failed to load chapter:", reason);
        if (active) {
          setResult({
            key: referenceKey,
            error: "Could not load this chapter.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [bookId, chapter, db, referenceKey, validReference]);

  const currentResult = result?.key === referenceKey ? result : null;
  const book =
    currentResult && "book" in currentResult ? currentResult.book : null;
  const verses =
    currentResult && "verses" in currentResult ? currentResult.verses : [];
  const error =
    !validReference
      ? "Invalid chapter reference."
      : currentResult && "error" in currentResult
        ? currentResult.error
        : null;
  const loading = validReference && currentResult === null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <View>
          <Text style={styles.title}>
            {book ? `${book.name} ${chapter}` : "Bible"}
          </Text>
          <Text style={styles.translation}>King James Version (KJV)</Text>
        </View>
      </View>

      {loading ? (
        <Text style={styles.message}>Loading chapter...</Text>
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={(item) => String(item.verse)}
          contentContainerStyle={styles.verses}
          renderItem={({ item }) => (
            <View style={styles.verse}>
              <Text style={styles.verseNumber}>{item.verse}</Text>
              <Text style={styles.verseText}>{item.text}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171A16",
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#383B36",
  },
  title: { color: "white", fontSize: 20, fontFamily: "Poppins-Medium" },
  translation: {
    color: "#A7A99F",
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    marginTop: 2,
  },
  message: {
    color: "#D4D5CF",
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    marginTop: 28,
    textAlign: "center",
  },
  verses: { paddingTop: 24, paddingBottom: 40 },
  verse: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  verseNumber: {
    color: "#A7A99F",
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    lineHeight: 30,
    width: 24,
    textAlign: "right",
  },
  verseText: {
    color: "#F2F0E9",
    flex: 1,
    fontFamily: "SourceSerif",
    fontSize: 19,
    lineHeight: 30,
  },
});
