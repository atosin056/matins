import { BOOKS } from "@/constants/books";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function books() {
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
        <Text
          style={{ color: "white", fontFamily: "Poppins-Medium", fontSize: 17 }}
        >
          {" "}
          {name}{" "}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#8A8F98" />
      </Pressable>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View>
            <Ionicons name="chevron-back" size={24} color="white" />
          </View>
          <View>
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontFamily: "Poppins-Medium",
              }}
            >
              Books
            </Text>
          </View>
        </View>
        <View>
          <View>
            <Ionicons name="mic-circle-outline" size={35} color="white" />
          </View>
        </View>
      </View>
      <View>
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
              onPress={() =>
                navigation.navigate("Chapters", { bookId: item.id })
              }
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 50,
    backgroundColor: "#171A16",
    flex: 1,
  },
  row: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowPressed: { backgroundColor: "#242524" },
  name: { color: "#fff", fontSize: 18, fontWeight: "500" },
});
