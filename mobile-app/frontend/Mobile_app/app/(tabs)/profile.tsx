import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export default function ProfileSettings() {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        console.log('Fetching user data for:', user.id);
        console.log('User metadata:', user.user_metadata);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
        } else {
          console.log('Fetched user data from database:', data);
          setUserData(data);
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      console.log('Starting sign out process...');
      await signOut();
      console.log('Sign out successful, navigating to login');
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
      </View>

      {/* Account */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#111" />
          ) : (
            <TextInput 
              value={userData?.first_name && userData?.last_name 
                ? `${userData.first_name} ${userData.last_name}` 
                : user?.user_metadata?.first_name && user?.user_metadata?.last_name
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                  : 'Not set'} 
              style={styles.input}
              editable={false}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={user?.email || ''}
            editable={false}
            style={styles.inputDisabled}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput 
            value={userData?.location || user?.user_metadata?.address || 'Not set'} 
            style={styles.input}
            placeholder="Enter location"
            editable={false}
          />
        </View>

        <TouchableOpacity style={styles.buttonOutline} onPress={() => { /* navigate to change password */ }}>
          <Feather name="lock" size={18} style={{ marginRight: 6 }} />
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {/* Appearance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Appearance</Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Feather name={isDarkMode ? "moon" : "sun"} size={20} color="#666" style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Dark Mode</Text>
          </View>
          <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Price Drop Alerts</Text>
          <Switch value={priceDropAlerts} onValueChange={setPriceDropAlerts} />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email Notifications</Text>
          <Switch value={emailNotifications} onValueChange={setEmailNotifications} />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>All Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
      </View>

      {/* Privacy */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy & Security</Text>

        <TouchableOpacity style={styles.listButton} onPress={() => { /* handle */ }}>
          <View style={styles.listLeft}>
            <Feather name="eye" size={20} color="#666" />
            <Text style={styles.listText}>Data & Privacy</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.listButton} onPress={() => { /* handle */ }}>
          <View style={styles.listLeft}>
            <Feather name="lock" size={20} color="#666" />
            <Text style={styles.listText}>Two-Factor Authentication</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>PriceFind v1.0.0</Text>
      </View>

      {/* Developer Option - Reset Onboarding */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={async () => {
          try {
            console.log('Resetting onboarding state...');
            await AsyncStorage.removeItem('hasSeenOnboarding');
            console.log('Onboarding state cleared');
            Alert.alert(
              'Reset Complete', 
              'Onboarding state has been reset. The app will now restart.',
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    await signOut();
                    setTimeout(() => {
                      router.replace('/onboarding');
                    }, 100);
                  }
                }
              ]
            );
          } catch (error) {
            console.error('Reset error:', error);
            Alert.alert('Error', 'Failed to reset. Please try again.');
          }
        }}
      >
        <Text style={styles.resetText}>🔧 Reset Onboarding (Dev)</Text>
      </TouchableOpacity>

      {/* Sign Out */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        <Feather name="log-out" size={18} color="#d00" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* small bottom padding so last items aren't flush to edge */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, backgroundColor: "#fff" },

  header: { backgroundColor: "#007AFF", padding: 16 },
  headerText: { color: "#fff", fontSize: 22, fontWeight: "bold" },

  card: {
    margin: 12,
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 10,
    elevation: 1,
  },

  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },

  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, color: "#555", marginBottom: 4 },

  input: {
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 6,
  },

  inputDisabled: {
    backgroundColor: "#ddd",
    padding: 8,
    borderRadius: 6,
    color: "#888",
  },

  buttonOutline: {
    marginTop: 6,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
  },

  buttonText: { fontSize: 14 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    alignItems: "center",
  },

  rowLeft: { 
    flexDirection: "row", 
    alignItems: "center" 
  },

  rowLabel: { fontSize: 14 },

  listButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  listLeft: { flexDirection: "row", alignItems: "center", gap: 10 },

  listText: { fontSize: 14, marginLeft: 10 },

  appInfo: { alignItems: "center", marginTop: 16 },
  appInfoText: { fontSize: 10, color: "#777" },

  resetButton: {
    padding: 10,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },

  resetText: { color: "#666", fontSize: 12 },

  logoutButton: {
    borderWidth: 1,
    borderColor: "#d00",
    padding: 12,
    marginHorizontal: 14,
    marginTop: 20,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: { color: "#d00", fontSize: 14 },
});
