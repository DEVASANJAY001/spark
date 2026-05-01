import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { COLORS, SPACING } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
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
        console.log('Native Google Sign-In not available.');
    }
}

const LandingScreen = ({ navigation }) => {
    const { colors } = useTheme();
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
            Alert.alert('Sign-In Failed', error.message || 'Google Sign-In failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <LinearGradient 
                colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']} 
                style={styles.overlay}
            />
            
            <SafeAreaView style={styles.content}>
                <View style={styles.topSection}>
                    <View style={styles.logoBox}>
                        <Image source={logo} style={styles.logoImage} />
                        <Text style={styles.logoText}>spark</Text>
                        <View style={styles.taglineBox}>
                            <View style={styles.tagLine} />
                            <Text style={styles.tagline}>CONNECT INTELLIGENTLY</Text>
                            <View style={styles.tagLine} />
                        </View>
                    </View>
                </View>

                <View style={styles.bottomSection}>
                    <Text style={styles.welcomeTitle}>Connect Intelligently</Text>
                    <Text style={styles.welcomeSub}>A premium social experience curated for high-value individuals.</Text>

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={[styles.premiumBtn, loading && { opacity: 0.7 }]}
                            onPress={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#FFFFFF', '#E0E0E0']}
                                style={styles.btnGradient}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Ionicons name="logo-google" size={18} color="#000" />
                                        <Text style={styles.premiumBtnText}>LOG IN WITH GOOGLE</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.outlineBtn}
                            onPress={() => navigation.navigate('EmailSignUp')}
                        >
                            <Text style={styles.outlineBtnText}>CREATE AN ACCOUNT</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('EmailLogin')}
                            style={styles.footerLink}
                        >
                            <Text style={styles.footerLinkText}>
                                Already a member? <Text style={styles.footerLinkBold}>Log In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.legalBox}>
                        <Text style={styles.legalText}>
                            By continuing, you agree to our <Text style={styles.legalBold}>Terms of Service</Text> and <Text style={styles.legalBold}>Privacy Policy</Text>.
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject },
    content: { flex: 1, paddingHorizontal: 30 },
    topSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    brandBadge: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    brandBadgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
    logoBox: { alignItems: 'center' },
    logoImage: { width: 100, height: 100, borderRadius: 28, marginBottom: 20 },
    logoText: { color: 'white', fontSize: 64, fontWeight: '900', letterSpacing: -3 },
    taglineBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
    tagLine: { height: 1, width: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
    tagline: { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: 3 },
    bottomSection: { paddingBottom: 40 },
    welcomeTitle: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 },
    welcomeSub: { color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 22, fontWeight: '500', marginBottom: 35 },
    buttonGroup: { gap: 15 },
    premiumBtn: { height: 64, borderRadius: 22, overflow: 'hidden' },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    premiumBtnText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    outlineBtn: {
        height: 64,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    outlineBtnText: { color: 'white', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
    footerLink: { marginTop: 10, alignItems: 'center' },
    footerLinkText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
    footerLinkBold: { color: 'white', fontWeight: '900', textDecorationLine: 'underline' },
    legalBox: { marginTop: 40 },
    legalText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', lineHeight: 16 },
    legalBold: { color: 'rgba(255,255,255,0.6)', fontWeight: '700' }
});

export default LandingScreen;

