import { BOOKS } from "@/constants/books";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ROW_HEIGHT = 50;
const DEFAULT_HINT = 'Try saying "Genesis 22"';

type MicStatus = "idle" | "listening" | "done";

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

  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<MicStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // the "variable" holding whatever was heard (updates live, even mid-sentence)
  const heardRef = useRef("");

  // 0 (silent) -> 1 (loud). Drives the outer ring.
  const level = useRef(new Animated.Value(0)).current;

  // ---------- speech events ----------
  useSpeechRecognitionEvent("speechstart", () => {
    setStatus("listening");
  });

  useSpeechRecognitionEvent("result", (ev) => {
    const text = ev.results[0]?.transcript ?? "";
    heardRef.current = text;
    if (ev.isFinal) {
      console.log("Heard:", text);
      setTranscript(text);
      setStatus("done");
      setVisible(false);
    }
  });

  useSpeechRecognitionEvent("volumechange", (ev) => {
    // ev.value is roughly -2 (silence) to 10 (loud)
    const n = Math.min(1, Math.max(0, (ev.value + 2) / 12));
    Animated.timing(level, {
      toValue: n,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  });

  useSpeechRecognitionEvent("error", (ev) => {
    console.log("Speech error:", ev.error, ev.message);
    if (ev.error === "no-speech") {
      setMessage("Didn't hear anything. Tap the mic to try again.");
    } else if (ev.error !== "aborted") {
      setMessage("Something went wrong. Tap the mic to try again.");
    }
    setStatus("idle");
  });

  useSpeechRecognitionEvent("end", () => {
    Animated.timing(level, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    // ended while still "listening" with no final result -> back to default
    setStatus((s) => (s === "listening" ? "idle" : s));
  });

  // ---------- actions ----------
  const startListening = async () => {
    const { granted } =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      Alert.alert(
        "Microphone needed",
        "Allow microphone access in Settings to use voice search.",
      );
      return false;
    }
    heardRef.current = "";
    setTranscript("");
    setMessage(null);
    setStatus("idle");
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
      volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
    });
    return true;
  };

  const openMic = async () => {
    console.log("Mic is ON");
    const ok = await startListening();
    if (ok) setVisible(true);
  };

  const closeMic = () => {
    console.log("Mic is OFF");
    ExpoSpeechRecognitionModule.abort();
    level.setValue(0);
    setVisible(false);
  };

  // ---------- text shown in the card ----------
  const cardText =
    status === "listening"
      ? "Listening…"
      : status === "done"
        ? transcript
        : (message ?? DEFAULT_HINT);

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeMic}
      >
        <Pressable style={styles.overlay} onPress={closeMic}>
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
                  if (status !== "listening") startListening();
                }}
              >
                <Ionicons name="mic" size={40} color="#000" />
              </Pressable>
            </View>
            <Text style={styles.cardText}>{cardText}</Text>
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
          <Pressable onPress={openMic} hitSlop={10}>
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
