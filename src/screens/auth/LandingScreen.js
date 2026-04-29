import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { COLORS, SPACING } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const LandingScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Web: Firebase popup — no browser redirect needed
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        // Mobile: Direct Firebase Google credential
        // In Expo Go, native Google Sign-In SDK is unavailable
        // Users should use Email login on mobile
        Alert.alert(
          'Use Email Login',
          'Google Sign-In requires a production build. Please use Email Sign Up or Login for now.',
          [
            { text: 'Sign Up with Email', onPress: () => navigation.navigate('EmailSignUp') },
            { text: 'Log In with Email', onPress: () => navigation.navigate('EmailLogin') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Sign-In Error', error.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={COLORS.gradient} style={styles.background}>
        <SafeAreaView style={styles.content}>
          <View style={styles.logoContainer}>
            <Ionicons name="flame" size={80} color="white" />
            <Text style={styles.logoText}>spark</Text>
          </View>

          <View style={styles.bottomContainer}>
            <Text style={styles.termsText}>
              By clicking Log In, you agree with our Terms. Learn how we process your data in our Privacy Policy and Cookies Policy.
            </Text>

            <TouchableOpacity
              style={[styles.whiteButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={COLORS.dark} style={styles.buttonIcon} />
                  <Text style={styles.whiteButtonText}>LOG IN WITH GOOGLE</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => navigation.navigate('EmailSignUp')}
            >
              <Text style={styles.outlineButtonText}>SIGN UP WITH EMAIL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('EmailLogin')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkHighlight}>Log In</Text></Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 50,
    fontWeight: 'bold',
    letterSpacing: -2,
  },
  bottomContainer: {
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  termsText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: SPACING.l,
    lineHeight: 18,
  },
  whiteButton: {
    backgroundColor: 'white',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 10,
  },
  whiteButtonText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 14,
  },
  outlineButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  outlineButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loginLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  loginLinkText: {
    color: 'white',
    fontSize: 14,
  },
  loginLinkHighlight: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default LandingScreen;