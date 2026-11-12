import { getBook, getBooks, getVerses } from "@/db/queries";
import type { Book } from "@/db/queries";
import { parseBibleReference } from "@/utils/bibleReference";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useSQLiteContext } from "expo-sqlite";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type MicStatus = "idle" | "preparing" | "listening" | "checking";

type BibleVoiceSearchContextValue = {
  openVoiceSearch: () => void;
};

const BibleVoiceSearchContext =
  createContext<BibleVoiceSearchContextValue | null>(null);

const DEFAULT_HINT = 'Try saying "Genesis 22"';

export function BibleVoiceSearchProvider({
  children,
}: {
  children: ReactNode;
}) {
  const db = useSQLiteContext();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<MicStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const booksRef = useRef<Book[]>([]);
  const processingVoiceRef = useRef(false);
  const openingVoiceRef = useRef(false);
  const recognitionActiveRef = useRef(false);
  const voiceAttemptRef = useRef(0);
  const level = useRef(new Animated.Value(0)).current;

  const openRecognizedReference = async (
    spokenReference: string,
    attempt: number,
  ) => {
    const reference = parseBibleReference(spokenReference, booksRef.current);
    if (!reference) {
      setMessage('Try saying a book and chapter, like "Genesis 22".');
      setVisible(false);
      setStatus("idle");
      processingVoiceRef.current = false;
      Alert.alert(
        "Reference not recognized",
        'Try saying a book and chapter, like "Genesis 22".',
      );
      return;
    }

    setStatus("checking");
    try {
      const book = await getBook(db, reference.bookId);
      if (attempt !== voiceAttemptRef.current) return;
      if (!book) {
        Alert.alert("Book not found", "That book isn't in the database.");
        return;
      }
      if (reference.chapter > book.chapter_count) {
        Alert.alert(
          "Chapter not found",
          `${book.name} has ${book.chapter_count} chapters.`,
        );
        return;
      }

      const verses = await getVerses(db, book.id, reference.chapter);
      if (attempt !== voiceAttemptRef.current) return;
      if (verses.length === 0) {
        Alert.alert("Chapter not found", "No verses are available for it.");
        return;
      }

      router.push({
        pathname: "/reader",
        params: { bookId: book.id, chapter: reference.chapter },
      });
    } catch (error: unknown) {
      if (attempt !== voiceAttemptRef.current) return;
      console.error("Failed to verify spoken Bible reference:", error);
      Alert.alert(
        "Couldn't open chapter",
        "The reference could not be checked. Please try again.",
      );
    } finally {
      if (attempt === voiceAttemptRef.current) {
        setVisible(false);
        setStatus("idle");
        processingVoiceRef.current = false;
      }
    }
  };

  useSpeechRecognitionEvent("speechstart", () => {
    recognitionActiveRef.current = true;
    setStatus("listening");
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";
    if (event.isFinal && !processingVoiceRef.current) {
      processingVoiceRef.current = true;
      recognitionActiveRef.current = false;
      void openRecognizedReference(text, voiceAttemptRef.current);
    }
  });

  useSpeechRecognitionEvent("volumechange", (event) => {
    const value = Math.min(1, Math.max(0, (event.value + 2) / 12));
    Animated.timing(level, {
      toValue: value,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech error:", event.error, event.message);
    recognitionActiveRef.current = false;
    processingVoiceRef.current = false;
    if (event.error === "no-speech") {
      setMessage("Didn't hear anything. Tap the mic to try again.");
    } else if (event.error !== "aborted") {
      setMessage("Something went wrong. Tap the mic to try again.");
    }
    setStatus("idle");
  });

  useSpeechRecognitionEvent("end", () => {
    recognitionActiveRef.current = false;
    Animated.timing(level, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    setStatus((current) =>
      current === "listening" ? "idle" : current,
    );
  });

  const openVoiceSearch = useCallback(async () => {
    if (
      openingVoiceRef.current ||
      recognitionActiveRef.current ||
      processingVoiceRef.current
    ) {
      return;
    }

    openingVoiceRef.current = true;
    const attempt = ++voiceAttemptRef.current;
    setVisible(true);
    setStatus("preparing");
    setMessage(null);

    try {
      const books = await getBooks(db);
      if (attempt !== voiceAttemptRef.current) return;
      if (books.length === 0) {
        Alert.alert("Books unavailable", "The book list could not be loaded.");
        setVisible(false);
        setStatus("idle");
        return;
      }
      booksRef.current = books;

      const { granted } =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (attempt !== voiceAttemptRef.current) return;
      if (!granted) {
        Alert.alert(
          "Microphone needed",
          "Allow microphone access in Settings to use voice search.",
        );
        setVisible(false);
        setStatus("idle");
        return;
      }

      setStatus("idle");
      recognitionActiveRef.current = true;
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
      });
    } catch (error: unknown) {
      if (attempt !== voiceAttemptRef.current) return;
      recognitionActiveRef.current = false;
      console.error("Failed to start Bible voice search:", error);
      setMessage("Something went wrong. Tap the mic to try again.");
      setStatus("idle");
      Alert.alert(
        "Voice search unavailable",
        "Could not load books or start listening. Please try again.",
      );
    } finally {
      if (attempt === voiceAttemptRef.current) {
        openingVoiceRef.current = false;
      }
    }
  }, [db]);

  const closeVoiceSearch = () => {
    voiceAttemptRef.current += 1;
    openingVoiceRef.current = false;
    processingVoiceRef.current = false;
    recognitionActiveRef.current = false;
    ExpoSpeechRecognitionModule.abort();
    level.setValue(0);
    setVisible(false);
    setStatus("idle");
  };

  const cardText =
    status === "listening"
      ? "Listening…"
      : status === "checking"
        ? "Checking reference…"
        : status === "preparing"
          ? "Getting ready…"
          : (message ?? DEFAULT_HINT);

  const contextValue = useMemo(
    () => ({ openVoiceSearch }),
    [openVoiceSearch],
  );

  return (
    <BibleVoiceSearchContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeVoiceSearch}
      >
        <Pressable style={styles.overlay} onPress={closeVoiceSearch}>
          <View style={styles.card}>
            <View style={styles.micWrap}>
              <Animated.View
                style={[
                  styles.ring,
                  {
                    transform: [
                      {
                        scale: level.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.6],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Pressable
                style={styles.micCircle}
                onPress={() => {
                  if (status !== "listening" && status !== "checking") {
                    void openVoiceSearch();
                  }
                }}
              >
                <Ionicons name="mic" size={40} color="#000" />
              </Pressable>
            </View>
            <Text style={styles.cardText}>{cardText}</Text>
          </View>
        </Pressable>
      </Modal>
    </BibleVoiceSearchContext.Provider>
  );
}

export function useBibleVoiceSearch() {
  const context = useContext(BibleVoiceSearchContext);
  if (!context) {
    throw new Error(
      "useBibleVoiceSearch must be used within a BibleVoiceSearchProvider.",
    );
  }
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#524F49",
    width: "75%",
    padding: 28,
    minHeight: 280,
    justifyContent: "center",
    borderRadius: 20,
    alignItems: "center",
    gap: 20,
  },
  micWrap: {
    width: 170,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  micCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    fontFamily: "Poppins-Medium",
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
});
