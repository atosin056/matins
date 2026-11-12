import { getBook } from "@/db/queries";
import type { Book } from "@/db/queries";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const COLUMNS = 5;
const GAP = 12;
const SIDE_PADDING = 18;

type BookLoadResult = {
  id: number;
  book: Book | null;
  error: boolean;
};

export default function Chapters() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // route params always arrive as strings
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const numericBookId = Number(bookId);
  const validBookId = Number.isInteger(numericBookId) && numericBookId > 0;
  const [bookResult, setBookResult] = useState<BookLoadResult | null>(null);

  useEffect(() => {
    if (!validBookId) return;

    let active = true;
    getBook(db, numericBookId)
      .then((book) => {
        if (active) {
          setBookResult({ id: numericBookId, book, error: false });
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load book:", error);
        if (active) setBookResult({ id: numericBookId, book: null, error: true });
      });

    return () => {
      active = false;
    };
  }, [db, numericBookId, validBookId]);

  const currentBookResult =
    bookResult?.id === numericBookId ? bookResult : null;
  const book = currentBookResult?.book ?? null;
  const loading = validBookId && currentBookResult === null;
  const loadError = currentBookResult?.error ?? false;

  // size each square from the screen width so the last row never stretches
  const cellSize = Math.floor(
    (width - SIDE_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS,
  );

  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="chevron-back" size={24} color="white" />
      </Pressable>
      <Text style={styles.title}>{book ? book.name : "Chapters"}</Text>
    </View>
  );

  if (loading || loadError || !book) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <Text style={styles.empty}>
          {loading
            ? "Loading chapters…"
            : loadError
              ? "Could not load this book."
              : "Couldn't find that book."}
        </Text>
      </SafeAreaView>
    );
  }

  // [1, 2, 3, ... chapter_count]
  const chapters = Array.from({ length: book.chapter_count }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.container}>
      {header}
      <Text style={styles.sub}>
        {book.chapter_count} {book.chapter_count === 1 ? "chapter" : "chapters"}
      </Text>

      <FlatList
        data={chapters}
        keyExtractor={(n) => String(n)}
        numColumns={COLUMNS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.cell,
              { width: cellSize, height: cellSize },
              pressed && styles.cellPressed,
            ]}
            onPress={() => {
              router.push({
                pathname: "/reader",
                params: { bookId: book.id, chapter: item },
              });
            }}
          >
            <Text style={styles.num}>{item}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 40,
    backgroundColor: "#171A16",
    flex: 1,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { color: "white", fontSize: 18, fontFamily: "Poppins-Medium" },
  sub: {
    color: "#8A8F98",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    marginTop: 12,
    marginBottom: 17,
  },
  cell: {
    backgroundColor: "#242724",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cellPressed: { backgroundColor: "#3A3D3A" },
  num: { color: "white", fontSize: 17, fontFamily: "Poppins-Medium" },
  empty: {
    color: "white",
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    marginTop: 40,
  },
});
