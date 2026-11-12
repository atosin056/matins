import type { Book, Verse } from "@/db/queries";
import { getBook, getVerses } from "@/db/queries";
import { generateChapterPrayer } from "@/services/prayer";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WORD_INTERVAL_MS = 360;

type ReadingPosition = {
  verseIndex: number;
  wordIndex: number;
};

type ReaderLoadResult =
  | { key: string; book: Book; verses: Verse[] }
  | { key: string; error: string };

export default function Reader() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { bookId: bookIdParam, chapter: chapterParam } = useLocalSearchParams<{
    bookId?: string;
    chapter?: string;
  }>();
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
        if (
          !foundBook ||
          chapter > foundBook.chapter_count ||
          rows.length === 0
        ) {
          setResult({
            key: referenceKey,
            error: "Couldn't find that chapter.",
          });
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
  const error = !validReference
    ? "Invalid chapter reference."
    : currentResult && "error" in currentResult
      ? currentResult.error
      : null;
  const loading = validReference && currentResult === null;

  return (
    <ReaderScreen
      key={referenceKey}
      book={book}
      chapter={chapter}
      verses={verses}
      error={error}
      loading={loading}
      onBack={() => router.back()}
    />
  );
}

type ReaderScreenProps = {
  book: Book | null;
  chapter: number;
  verses: Verse[];
  error: string | null;
  loading: boolean;
  onBack: () => void;
};

function ReaderScreen({
  book,
  chapter,
  verses,
  error,
  loading,
  onBack,
}: ReaderScreenProps) {
  const listRef = useRef<FlatList<Verse>>(null);
  const prayerRequestId = useRef(0);
  const [readingPosition, setReadingPosition] =
    useState<ReadingPosition | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readingFinished, setReadingFinished] = useState(false);
  const [prayerVisible, setPrayerVisible] = useState(false);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerText, setPrayerText] = useState<string | null>(null);
  const [prayerError, setPrayerError] = useState<string | null>(null);
  const readingVerseIndex = readingPosition?.verseIndex;

  useEffect(
    () => () => {
      prayerRequestId.current += 1;
    },
    [],
  );

  useEffect(() => {
    if (!isReading || !readingPosition) return;

    const timer = setTimeout(() => {
      const currentVerse = verses[readingPosition.verseIndex];
      const wordCount = currentVerse?.text.trim().split(/\s+/).length ?? 0;

      if (readingPosition.wordIndex + 1 < wordCount) {
        setReadingPosition({
          ...readingPosition,
          wordIndex: readingPosition.wordIndex + 1,
        });
      } else if (readingPosition.verseIndex + 1 < verses.length) {
        setReadingPosition({
          verseIndex: readingPosition.verseIndex + 1,
          wordIndex: 0,
        });
      } else {
        setIsReading(false);
        setReadingFinished(true);
      }
    }, WORD_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [isReading, readingPosition, verses]);

  useEffect(() => {
    if (!isReading || readingVerseIndex === undefined) return;

    listRef.current?.scrollToIndex({
      index: readingVerseIndex,
      animated: true,
      viewPosition: 0.35,
    });
  }, [isReading, readingVerseIndex]);

  const handlePlayPress = () => {
    if (isReading) {
      setIsReading(false);
      return;
    }

    if (readingFinished || readingPosition === null) {
      setReadingPosition({ verseIndex: 0, wordIndex: 0 });
      setReadingFinished(false);
    }
    setIsReading(true);
  };

  const handlePrayerPress = async () => {
    if (!book || verses.length === 0 || prayerLoading) return;

    const requestId = prayerRequestId.current;
    setPrayerVisible(true);
    setPrayerLoading(true);
    setPrayerText(null);
    setPrayerError(null);

    try {
      const prayer = await generateChapterPrayer(
        `${book.name} ${chapter}`,
        verses,
      );
      if (prayerRequestId.current === requestId) {
        setPrayerText(prayer);
      }
    } catch (reason) {
      if (prayerRequestId.current === requestId) {
        console.error("Failed to generate prayer:", reason);
        setPrayerError(
          "Could not generate a prayer. Check your connection and prayer API endpoint, then try again.",
        );
      }
    } finally {
      if (prayerRequestId.current === requestId) {
        setPrayerLoading(false);
      }
    }
  };

  const renderVerseText = (text: string, verseIndex: number) => {
    let wordIndex = 0;

    return text.split(/(\s+)/).map((part, partIndex) => {
      if (/^\s+$/.test(part)) {
        return part;
      }

      const isCurrentWord =
        readingPosition?.verseIndex === verseIndex &&
        readingPosition.wordIndex === wordIndex;
      const isDimmed = readingPosition !== null && !isCurrentWord;
      wordIndex += 1;

      return (
        <Text
          key={`${verseIndex}-${partIndex}`}
          style={
            isCurrentWord
              ? styles.currentWord
              : isDimmed
                ? styles.dimmedWord
                : undefined
          }
        >
          {part}
        </Text>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <View
          style={{
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
          }}
        >
          <View>
            <Text style={styles.title}>
              {book ? `${book.name} ${chapter}` : "Bible"}
            </Text>
            <Text style={styles.translation}>King James Version (KJV)</Text>
          </View>
        </View>
      </View>

      <View style={styles.readerContent}>
        {loading ? (
          <Text style={styles.message}>Loading chapter...</Text>
        ) : error ? (
          <Text style={styles.message}>{error}</Text>
        ) : (
          <FlatList
            ref={listRef}
            data={verses}
            extraData={readingPosition}
            keyExtractor={(item) => String(item.verse)}
            contentContainerStyle={styles.verses}
            onScrollToIndexFailed={({ index, averageItemLength }) => {
              listRef.current?.scrollToOffset({
                offset: averageItemLength * index,
                animated: true,
              });
            }}
            renderItem={({ item, index }) => (
              <View style={styles.verse}>
                <Text
                  style={[
                    styles.verseNumber,
                    readingPosition !== null &&
                      (readingPosition.verseIndex === index
                        ? styles.currentVerseNumber
                        : styles.dimmedWord),
                  ]}
                >
                  {item.verse}
                </Text>
                <Text style={styles.verseText}>
                  {renderVerseText(item.text, index)}
                </Text>
              </View>
            )}
          />
        )}

        {book && verses.length > 0 && (
          <View style={styles.actionButtons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Generate a prayer for this chapter"
              disabled={prayerLoading}
              onPress={handlePrayerPress}
              style={[styles.actionButton, styles.prayerButton]}
            >
              <Text style={styles.prayerIcon}>🙏</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isReading ? "Pause guided reading" : "Play guided reading"
              }
              onPress={handlePlayPress}
              style={[styles.actionButton, styles.playButton]}
            >
              <Ionicons
                name={isReading ? "pause" : "play"}
                size={30}
                color="white"
                style={!isReading && styles.playIcon}
              />
            </Pressable>
          </View>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={prayerVisible}
        onRequestClose={() => setPrayerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.prayerCard}>
            <View style={styles.prayerHeader}>
              <Text style={styles.prayerTitle}>
                Prayer for {book ? `${book.name} ${chapter}` : "this chapter"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close prayer"
                onPress={() => setPrayerVisible(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={24} color="#F2F0E9" />
              </Pressable>
            </View>

            {prayerLoading ? (
              <View style={styles.prayerStatus}>
                <ActivityIndicator color="#F49B27" />
                <Text style={styles.prayerStatusText}>
                  Preparing your prayer...
                </Text>
              </View>
            ) : prayerError ? (
              <Text style={styles.prayerError}>{prayerError}</Text>
            ) : prayerText ? (
              <ScrollView>
                <Text style={styles.prayerText}>{prayerText}</Text>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
  readerContent: { flex: 1 },
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
  verses: { paddingTop: 24, paddingBottom: 150 },
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
  dimmedWord: { color: "#686B63" },
  currentVerseNumber: { color: "#F49B27" },
  currentWord: { color: "#F49B27" },
  actionButtons: {
    position: "absolute",
    right: 4,
    bottom: 36,
    alignItems: "center",
    gap: 14,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  prayerButton: { backgroundColor: "#514F4A" },
  prayerIcon: { fontSize: 20 },
  playButton: { backgroundColor: "#F49B27" },
  playIcon: { marginLeft: 4 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  prayerCard: {
    maxHeight: "75%",
    backgroundColor: "#242720",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  prayerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  prayerTitle: {
    color: "#F2F0E9",
    fontSize: 18,
    fontFamily: "Poppins-Medium",
    flex: 1,
  },
  prayerStatus: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 14,
  },
  prayerStatusText: {
    color: "#D4D5CF",
    fontFamily: "Poppins-Regular",
    fontSize: 15,
  },
  prayerError: {
    color: "#F2B7A9",
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    lineHeight: 24,
    paddingBottom: 12,
  },
  prayerText: {
    color: "#F2F0E9",
    fontFamily: "SourceSerif",
    fontSize: 18,
    lineHeight: 29,
    paddingBottom: 8,
  },
});
