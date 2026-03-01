import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ListProvider } from "@/contexts/ListContext";
import { FavouritesProvider } from "@/contexts/FavouritesContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();

  const { session, isLoading: authLoading } = useAuth();

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  // Prevent multiple redirects
  const alreadyRedirected = useRef(false);

  // Load onboarding flag once
  useEffect(() => {
    AsyncStorage.getItem("hasSeenOnboarding").then((value) => {
      setHasSeenOnboarding(value === "true");
    });
  }, []);

  useEffect(() => {
    if (authLoading || hasSeenOnboarding === null) return;

    const segment = segments[0];

    const inOnboarding = segment === "onboarding";
    const inAuth = segment === "login" || segment === "signup";

    // Only allow **one redirect per render cycle**
    if (alreadyRedirected.current) return;

    // FIRST TIME USER → GO TO ONBOARDING
    if (!hasSeenOnboarding && !inOnboarding) {
      alreadyRedirected.current = true;
      router.replace("/onboarding");
      return;
    }

    // SEEN ONBOARDING BUT NOT LOGGED IN (only redirect if not in auth screens)
    if (hasSeenOnboarding && !session && !inAuth && !inOnboarding) {
      alreadyRedirected.current = true;
      router.replace("/login");
      return;
    }

    // LOGGED IN → BLOCK AUTH & ONBOARDING
    if (session && (inAuth || inOnboarding)) {
      alreadyRedirected.current = true;
      router.replace("/(tabs)");
      return;
    }

    // If navigation settles, allow future redirects again
    setTimeout(() => {
      alreadyRedirected.current = false;
    }, 300);

  }, [authLoading, session, hasSeenOnboarding, segments]);

  if (authLoading || hasSeenOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FavouritesProvider>
          <ListProvider>
            <RootLayoutNav />
          </ListProvider>
        </FavouritesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
