import { getBooks } from "@/db/queries";
import type { Book } from "@/db/queries";
import { useBibleVoiceSearch } from "@/components/BibleVoiceSearchProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ROW_HEIGHT = 50;

type BookRowProps = {
  name: string;
  onPress: () => void;
};

function BookRow({ name, onPress }: BookRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.name}>{name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#8A8F98" />
    </Pressable>
  );
}

export default function Books() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { openVoiceSearch } = useBibleVoiceSearch();
  const [books, setBooks] = useState<Book[]>([]);
  const [booksReady, setBooksReady] = useState(false);
  const [bookLoadError, setBookLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    getBooks(db)
      .then((rows) => {
        if (active) {
          setBooks(rows);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load books:", error);
        if (active) setBookLoadError(true);
      })
      .finally(() => {
        if (active) setBooksReady(true);
      });

    return () => {
      active = false;
    };
  }, [db]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          <Text style={styles.title}>Books</Text>
        </View>
        <Pressable onPress={openVoiceSearch} hitSlop={10}>
          <Ionicons name="mic-circle-outline" size={35} color="white" />
        </Pressable>
      </View>

      <FlatList
        style={{ marginTop: 20 }}
        data={books}
        keyExtractor={(b) => String(b.id)}
        getItemLayout={(_, i) => ({
          length: ROW_HEIGHT,
          offset: ROW_HEIGHT * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <BookRow
            name={item.name}
            onPress={() => {
              console.log("Tapped book:", item.id, item.name);
              router.push({
                pathname: "/chapters",
                params: { bookId: item.id },
              });
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {booksReady
              ? bookLoadError
                ? "Could not load books."
                : "No books available."
              : "Loading books..."}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 40,
    backgroundColor: "#171A16",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { color: "white", fontSize: 18, fontFamily: "Poppins-Medium" },
  row: {
    height: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowPressed: { backgroundColor: "#242524" },
  name: { color: "white", fontFamily: "Poppins-Medium", fontSize: 17 },
  empty: {
    color: "#8A8F98",
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    marginTop: 24,
    textAlign: "center",
  },
});
