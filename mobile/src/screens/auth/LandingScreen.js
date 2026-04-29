import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { COLORS, SPACING } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const logo = require('../../logo.jpeg');

import Constants from 'expo-constants';

let GoogleSignin;
if (Constants.appOwnership !== 'expo') {
    try {
        GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
        GoogleSignin.configure({
            webClientId: '477160304299-o4b3bhk52gmvt7j082a14erk3su1ub43.apps.googleusercontent.com',
            offlineAccess: true,
        });
    } catch (e) {
        console.log('Native Google Sign-In not available in this environment.');
    }
}

const LandingScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        if (!GoogleSignin) {
            Alert.alert('Not Available', 'Google Sign-In requires a native build.');
            return;
        }
        setLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            if (response.type === 'cancelled') { setLoading(false); return; }
            const idToken = response.data?.idToken ?? response.idToken;
            if (!idToken) throw new Error('No ID token returned.');
            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, credential);
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            Alert.alert('Sign-In Failed', error.message || 'Google Sign-In failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={COLORS.gradient} style={styles.background}>
                <SafeAreaView style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Image source={logo} style={styles.logoImage} resizeMode="contain" />
                        <Text style={styles.logoText}>spark</Text>
                        <Text style={styles.tagline}>Find Your Flame</Text>
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
    container: { flex: 1 },
    background: { flex: 1 },
    content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: SPACING.l },
    logoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logoImage: { width: 90, height: 90, borderRadius: 22, marginBottom: 12 },
    logoText: { color: 'white', fontSize: 50, fontWeight: 'bold', letterSpacing: -2 },
    tagline: { color: 'rgba(255,255,255,0.75)', fontSize: 13, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' },
    bottomContainer: { paddingBottom: SPACING.xl, alignItems: 'center' },
    termsText: { color: 'white', textAlign: 'center', fontSize: 12, marginBottom: SPACING.l, lineHeight: 18 },
    whiteButton: {
        backgroundColor: 'white', width: '100%', paddingVertical: 15,
        borderRadius: 30, flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', marginBottom: SPACING.m,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonIcon: { marginRight: 10 },
    whiteButtonText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
    outlineButton: {
        width: '100%', paddingVertical: 15, borderRadius: 30,
        borderWidth: 2, borderColor: 'white', justifyContent: 'center',
        alignItems: 'center', marginBottom: SPACING.l,
    },
    outlineButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    loginLink: { marginTop: 10, alignItems: 'center' },
    loginLinkText: { color: 'white', fontSize: 14 },
    loginLinkHighlight: { fontWeight: 'bold', textDecorationLine: 'underline' },
});

export default LandingScreen;
