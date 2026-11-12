import { BOOKS } from "@/constants/books";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
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
  const router = useRouter();
  const [listening, setListening] = useState(false);

  const toggleMic = () => {
    setListening((prev) => {
      console.log(prev ? "Mic is OFF" : "Mic is ON");
      return !prev;
    });
  };

  return (
    <>
      <Modal
        visible={listening}
        transparent
        animationType="fade"
        onRequestClose={() => setListening(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setListening(false)}>
          <View style={styles.card}>
            <View
              style={{
                backgroundColor: "#F2F2F2",
                borderRadius: 50,
                padding: 20,
              }}
            >
              <Ionicons name="mic" size={40} color="#000" />
            </View>
            <Text style={styles.cardText}>Try Saying "Genesis 22"</Text>
          </View>
        </Pressable>
      </Modal>

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </Pressable>
            <Text style={styles.title}>Books</Text>
          </View>
          <Pressable onPress={toggleMic} hitSlop={10}>
            <Ionicons name="mic-circle-outline" size={35} color="white" />
          </Pressable>
        </View>

        <FlatList
          style={{ marginTop: 20 }}
          data={BOOKS}
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
        />
      </SafeAreaView>
    </>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#524F49",
    width: "70%",
    padding: 28,
    minHeight: 250,
    justifyContent: "center",
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
  },
  cardText: { fontFamily: "Poppins-Medium", fontSize: 18, color: "#fff" },
});
