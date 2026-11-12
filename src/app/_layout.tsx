import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { useEffect } from "react";

import { BibleVoiceSearchProvider } from "@/components/BibleVoiceSearchProvider";
import { migrateDbIfNeeded } from "@/db/migrate";

SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  useEffect(() => {
    // Runs only after fonts are loaded AND SQLite onInit has finished
    SplashScreen.hideAsync();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Poppins-Regular": require("@/assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("@/assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("@/assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("@/assets/fonts/Poppins-Bold.ttf"),
    SourceSerif: require("@/assets/fonts/SourceSerif4.ttf"),
  });

  if (!loaded && !error) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="matins.db" onInit={migrateDbIfNeeded}>
      <BibleVoiceSearchProvider>
        <AppNavigator />
      </BibleVoiceSearchProvider>
    </SQLiteProvider>
  );
}
