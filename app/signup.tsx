import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = async () => {
    console.log('🚀 handleSignup called');
    setErrorMessage('');
    
    // Debug: Log state values at the very start
    console.log('=== SIGNUP START ===');
    console.log('firstName:', firstName, '(length:', firstName.length, ')');
    console.log('lastName:', lastName, '(length:', lastName.length, ')');
    console.log('email:', email, '(length:', email.length, ')');
    console.log('address:', address, '(length:', address.length, ')');
    console.log('==================');
    
    // Basic validations
    if (!firstName || !lastName || !email || !address || !password || !confirmPassword) {
      const msg = 'Please fill in all fields.';
      setErrorMessage(msg);
      Alert.alert('Missing fields', msg);
      return;
    }
    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setErrorMessage(msg);
      Alert.alert('Password mismatch', msg);
      return;
    }
    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setErrorMessage(msg);
      Alert.alert('Weak password', msg);
      return;
    }

    setIsLoading(true);
    console.log('⏳ Loading set to true');
    
    try {
      console.log('Attempting signup with:', { email, firstName, lastName, address });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName, address },
        },
      });

      if (error) {
        console.error('Signup error from Supabase:', error);
        throw error;
      }

      console.log('Signup successful!');
      console.log('User ID:', data.user?.id);
      console.log('User email:', data.user?.email);
      console.log('User metadata:', data.user?.user_metadata);
      console.log('Session created:', !!data.session);
      console.log('✅ Database trigger will handle user profile creation');

      setIsLoading(false);

      // Navigate immediately instead of using Alert
      if (data.user && !data.session) {
        console.log('📧 Email confirmation required - navigating to login');
        router.replace('/login');
        // Show alert after navigation
        setTimeout(() => {
          Alert.alert(
            'Verify Your Email',
            `We've sent a verification link to ${email}. Please check your email to verify your account.`
          );
        }, 500);
        return;
      }

      // Case 2: Auto-login (session created)
      if (data.session) {
        console.log('✅ Session created - navigating to tabs');
        router.replace('/(tabs)');
        setTimeout(() => {
          Alert.alert('Account created!', 'Welcome to PriceFind!');
        }, 500);
        return;
      }

      // Case 3: Default fallback
      console.log('⚠️ Fallback case - navigating to login');
      router.replace('/login');
      setTimeout(() => {
        Alert.alert('Account created!', 'You can now log in.');
      }, 500);
    } catch (err: any) {
      console.error('❌ Signup error caught:', err);
      const errorMsg = err?.message || 'Unable to create account';
      setErrorMessage(errorMsg);
      Alert.alert('Sign up failed', errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>Create your PriceFind account</Text>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
            onPress={() => {
              console.log('Sign Up button pressed');
              handleSignup();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  input: {
    height: 48,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#111',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  footerLink: {
    color: '#111',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    fontWeight: '600',
  },
});
