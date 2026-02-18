import React, { useState, useEffect, useMemo } from "react";
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
import { useTheme } from "@/contexts/ThemeContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export default function ProfileSettings() {
  const { signOut, user } = useAuth();
  const { isDarkMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleDarkMode = async () => {
    // Toggle between light and dark (not using 'auto' for simplicity)
    const newMode = isDarkMode ? 'light' : 'dark';
    await setThemeMode(newMode);
  };

  const switchTrackColor = { false: colors.cardBorder, true: colors.accent };
  const switchThumbColor = colors.card;

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
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <TextInput 
              value={userData?.first_name && userData?.last_name 
                ? `${userData.first_name} ${userData.last_name}` 
                : user?.user_metadata?.first_name && user?.user_metadata?.last_name
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                  : 'Not set'} 
              style={styles.input}
              placeholderTextColor={colors.textMuted}
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
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput 
            value={userData?.location || user?.user_metadata?.address || 'Not set'} 
            style={styles.input}
            placeholder="Enter location"
            editable={false}
            placeholderTextColor={colors.textMuted}
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
            <Feather name={isDarkMode ? "moon" : "sun"} size={20} color={colors.icon} style={{ marginRight: 10 }} />
            <Text style={styles.rowLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={switchTrackColor}
            thumbColor={switchThumbColor}
          />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Price Drop Alerts</Text>
          <Switch
            value={priceDropAlerts}
            onValueChange={setPriceDropAlerts}
            trackColor={switchTrackColor}
            thumbColor={switchThumbColor}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email Notifications</Text>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={switchTrackColor}
            thumbColor={switchThumbColor}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>All Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={switchTrackColor}
            thumbColor={switchThumbColor}
          />
        </View>
      </View>

      {/* Privacy */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy & Security</Text>

        <TouchableOpacity style={styles.listButton} onPress={() => { /* handle */ }}>
          <View style={styles.listLeft}>
            <Feather name="eye" size={20} color={colors.icon} />
            <Text style={styles.listText}>Data & Privacy</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.listButton} onPress={() => { /* handle */ }}>
          <View style={styles.listLeft}>
            <Feather name="lock" size={20} color={colors.icon} />
            <Text style={styles.listText}>Two-Factor Authentication</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.icon} />
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
        <Feather name="log-out" size={18} color={colors.danger} style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* small bottom padding so last items aren't flush to edge */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: { paddingBottom: 30, backgroundColor: colors.background },

    header: { backgroundColor: colors.accent, padding: 16 },
    headerText: { color: colors.card, fontSize: 22, fontWeight: "bold" },

    card: {
      margin: 12,
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.cardBorder,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
    },

    cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10, color: colors.text },

    inputGroup: { marginBottom: 12 },
    label: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },

    input: {
      backgroundColor: colors.surface,
      padding: 8,
      borderRadius: 6,
      color: colors.text,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.cardBorder,
    },

    inputDisabled: {
      backgroundColor: colors.surface,
      padding: 8,
      borderRadius: 6,
      color: colors.textMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.cardBorder,
    },

    buttonOutline: {
      marginTop: 6,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 8,
    },

    buttonText: { fontSize: 14, color: colors.text },

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

    rowLabel: { fontSize: 14, color: colors.text },

    listButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },

    listLeft: { flexDirection: "row", alignItems: "center", gap: 10 },

    listText: { fontSize: 14, marginLeft: 10, color: colors.text },

    appInfo: { alignItems: "center", marginTop: 16 },
    appInfoText: { fontSize: 10, color: colors.textMuted },

    resetButton: {
      padding: 10,
      marginHorizontal: 14,
      marginTop: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      alignItems: "center",
    },

    resetText: { color: colors.textMuted, fontSize: 12 },

    logoutButton: {
      borderWidth: 1,
      borderColor: colors.danger,
      padding: 12,
      marginHorizontal: 14,
      marginTop: 20,
      borderRadius: 8,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },

    logoutText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  });
