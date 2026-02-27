import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();

  async function onSignup() {
    try {
      console.log('Setting hasSeenOnboarding to true');
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      console.log('Navigating to signup');
      router.replace("/signup");
    } catch (error) {
      console.error('Error in onSignup:', error);
    }
  }

  async function onLogin() {
    try {
      console.log('Setting hasSeenOnboarding to true');
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      console.log('Navigating to login');
      router.replace("/login");
    } catch (error) {
      
      console.error('Error in onLogin:', error);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.logo}>🏷️</Text>
        <Text style={styles.title}>PriceFind</Text>
        <Text style={styles.subtitle}>Find the best deals near you</Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.button, styles.signup]} onPress={onSignup}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.login]} onPress={onLogin}>
            <Text style={[styles.buttonText, styles.loginText]}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  logo: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 8, textAlign: "center", color: "#111" },
  subtitle: { fontSize: 16, color: "#6b7280", marginBottom: 40, textAlign: "center" },
  buttonsRow: { flexDirection: "row", gap: 12 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 120,
    alignItems: "center",
  },
  signup: { backgroundColor: "#111" },
  login: { backgroundColor: "transparent", borderWidth: 2, borderColor: "#111" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  loginText: { color: "#111" },
});

