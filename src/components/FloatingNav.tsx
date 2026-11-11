import { Ionicons } from "@expo/vector-icons";
import { Href, usePathname, useRouter } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type NavItem = {
  key: string;
  route: Href;
  icon: (p: { color: string; size: number; active: boolean }) => ReactNode;
  primary?: boolean; // the big highlighted button
};

// Edit this list to change the buttons and the screens they open
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    key: "notes",
    route: "/",
    icon: ({ color, size }) => (
      <Ionicons name="document-text-outline" size={size} color={color} />
    ),
  },
  {
    key: "favorites",
    route: "/favorites",
    icon: ({ color, size, active }) => (
      <Ionicons
        name={active ? "heart" : "heart-outline"}
        size={size}
        color={color}
      />
    ),
  },
  {
    key: "create",
    route: "/create",
    primary: true,
    icon: ({ color, size }) => (
      <Ionicons name="add-circle-outline" size={size} color={color} />
    ),
  },
  {
    key: "library",
    route: "/library",
    icon: ({ color, size }) => (
      <Ionicons name="book-outline" size={size} color={color} />
    ),
  },
  {
    key: "settings",
    route: "/settings",
    icon: ({ color, size }) => (
      <Ionicons name="settings-outline" size={size} color={color} />
    ),
  },
];

// Add this much bottom padding to screens so content isn't hidden behind the nav
export const NAV_SPACE = 210;

type Props = {
  items?: NavItem[];
  hideOn?: string[]; // pathnames where the nav should not show
};

const pathOf = (route: Href) =>
  typeof route === "string" ? route : route.pathname;

const isActive = (current: string, route: Href) => {
  const p = pathOf(route);
  if (p === "/") return current === "/";
  return current === p || current.startsWith(p + "/");
};

export default function FloatingNav({
  items = DEFAULT_NAV_ITEMS,
  hideOn = [],
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (hideOn.includes(pathname)) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + 42 }]}
    >
      <View style={styles.bar}>
        {items.map((item) => {
          const active = isActive(pathname, item.route);

          if (item.primary) {
            return (
              <Pressable
                key={item.key}
                onPress={() => router.navigate(item.route)}
                style={styles.primary}
                hitSlop={8}
              >
                {item.icon({ color: "#2A2A1E", size: 30, active })}
              </Pressable>
            );
          }

          return (
            <Pressable
              key={item.key}
              onPress={() => router.navigate(item.route)}
              style={styles.item}
              hitSlop={8}
            >
              {item.icon({
                color: active ? "#E8E4CE" : "#9C9A89",
                size: 26,
                active,
              })}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 18,
    right: 18,
  },
  bar: {
    height: 70,
    borderRadius: 35,
    backgroundColor: "#2A2D25",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    // shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  item: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFD966",
    alignItems: "center",
    justifyContent: "center",
  },
});
