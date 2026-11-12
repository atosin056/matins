import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function books() {
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
});
