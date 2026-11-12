import avatar from "@/assets/images/avatar.png";
import Flame from "@/assets/images/Flame.svg";
import todayjourney from "@/assets/images/todayjourney.png";
import DayPicker from "@/components/DayPicker";
import FloatingNav, { NavItem } from "@/components/FloatingNav";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const items: NavItem[] = [
    {
      key: "home",
      route: "/",
      icon: ({ color }) => (
        <Ionicons name="home-outline" size={26} color={color} />
      ),
    },
    {
      key: "books",
      route: "/books",
      icon: ({ color }) => (
        <Ionicons name="book-outline" size={26} color={color} />
      ),
    },
    {
      key: "add",
      route: "/add",
      primary: true,
      icon: () => <Ionicons name="mic" size={32} color="#2A2A1E" />,
    },
    {
      key: "streak",
      route: "/streak",
      icon: ({ color }) => (
        <Ionicons name="settings-outline" size={26} color={color} />
      ),
    },
  ];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={avatar} style={styles.avatar} />
          <View style={styles.holder}>
            <Flame />
          </View>
        </View>

        {/* Titles */}
        <View>
          <Text style={styles.title}>Today's Journey</Text>
          <Text style={styles.subtitle}>Tailored just for you</Text>
        </View>

        {/* Day picker (it has its own horizontal padding, so cancel the container's) */}
        <View style={styles.pickerWrap}>
          <DayPicker onSelect={(date) => console.log(date)} />
        </View>

        {/* Journey card */}
        <View style={styles.card}>
          <Image
            source={todayjourney}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View
            style={[StyleSheet.absoluteFill, styles.overlay]}
            pointerEvents="none"
          />
          <Text
            style={{ textAlign: "center", lineHeight: 30, color: "#B7B6A6" }}
          >
            Today's Journey
          </Text>
          <Text style={styles.cardTitle}>
            Let the Spirit breathe peace while you read, listen, and reflect.
          </Text>
        </View>
      </View>
      <FloatingNav items={items} />
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
  content: {
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  holder: {
    backgroundColor: "#30342C",
    borderRadius: 100,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: "SourceSerif",
    color: "#E8E4CE",
    fontSize: 32,
  },
  subtitle: {
    color: "#B7B6A6",
    fontFamily: "SourceSerif",
    lineHeight: 25,
    fontSize: 15,
  },
  pickerWrap: {
    marginHorizontal: -18, // lets the day row scroll edge to edge
  },
  card: {
    height: 320,
    borderRadius: 32,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 20,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  cardTitle: {
    fontFamily: "SourceSerif",
    color: "#E8E4CE",
    fontSize: 30,
    textAlign: "center",
  },
});
