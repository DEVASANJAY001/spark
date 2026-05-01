import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

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
        console.log('Google Sign-In module not available.');
    }
}

const EmailSignUpScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userIP, setUserIP] = useState('');

    useEffect(() => { fetchIP(); }, []);

    const fetchIP = async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            setUserIP(data.ip);
        } catch (error) {
            console.warn('Could not fetch IP:', error.message);
        }
    };

    const handleGoogleSignUp = async () => {
        if (!GoogleSignin) {
            Alert.alert('Development Build Required', 'Google Sign-In requires a native development build.');
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
            console.error('Google Sign-Up Error:', error);
            Alert.alert('Sign-Up Failed', error.message || 'Google Sign-In failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) { Alert.alert('Error', 'Please fill in all fields.'); return; }
        if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match.'); return; }
        if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }

        setLoading(true);
        let userCreated = null;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            userCreated = userCredential.user;

            if (userIP) {
                const ipQuery = query(collection(db, 'users'), where('registrationIP', '==', userIP));
                const ipSnapshot = await getDocs(ipQuery);
                if (ipSnapshot.size >= 5) {
                    await userCreated.delete();
                    throw new Error('Security Alert: Account limit reached on this network.');
                }
            }

            await setDoc(doc(db, 'users', userCreated.uid), {
                uid: userCreated.uid,
                email: userCreated.email,
                createdAt: new Date().toISOString(),
                registrationIP: userIP || 'unknown',
                lastLoginIP: userIP || 'unknown',
                role: 'user',
                onboarded: false,
            });
        } catch (error) {
            console.error('Sign Up Error:', error);
            if (userCreated && error.code !== 'auth/email-already-in-use') {
                try { await userCreated.delete(); } catch (e) { }
            }
            let errorMessage = error.message || 'Failed to create account.';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'This email is already in use.';
            if (error.code === 'auth/invalid-email') errorMessage = 'Please enter a valid email address.';
            Alert.alert('Sign Up Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
                            <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleBox}>
                            <Text style={[styles.title, { color: colors.text }]}>Join Spark</Text>
                        </View>
                    </View>

                    <View style={styles.form}>
                        {/* Google Sign Up First - Preferred */}
                        <TouchableOpacity
                            style={[styles.googleBtn, { backgroundColor: colors.surface }]}
                            onPress={handleGoogleSignUp}
                            disabled={loading}
                        >
                            <Ionicons name="logo-google" size={18} color={colors.text} />
                            <Text style={[styles.googleBtnText, { color: colors.text }]}>JOIN WITH GOOGLE</Text>
                        </TouchableOpacity>

                        <View style={styles.dividerRow}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR USE EMAIL</Text>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
                                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="your@email.com"
                                    placeholderTextColor={colors.textSecondary + '80'}
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CHOOSE PASSWORD</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="At least 6 characters"
                                    placeholderTextColor={colors.textSecondary + '80'}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CONFIRM PASSWORD</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Repeat password"
                                    placeholderTextColor={colors.textSecondary + '80'}
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.signUpBtn}
                            disabled={loading}
                            onPress={handleSignUp}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#FF3366']}
                                style={styles.btnGradient}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.signUpBtnText}>CREATE ACCOUNT</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('EmailLogin')}
                        style={styles.footerLink}
                    >
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                            Already a member? <Text style={[styles.footerBold, { color: COLORS.primary }]}>Log In</Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.securityBox}>
                        <Ionicons name="shield-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.securityText, { color: colors.textSecondary }]}>
                            Verified network security active. Registration IP: {userIP || '...'}
                        </Text>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    content: { flex: 1, paddingHorizontal: 25 },
    header: { marginTop: 20, marginBottom: 30, flexDirection: 'row', alignItems: 'center', gap: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    headerTitleBox: { flex: 1 },
    brandLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    form: { gap: 15 },
    googleBtn: {
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    googleBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginVertical: 10 },
    divider: { flex: 1, height: 1, opacity: 0.3 },
    dividerText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    inputGroup: { gap: 10 },
    inputLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    inputWrapper: {
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        gap: 12,
    },
    input: { flex: 1, fontSize: 16, fontWeight: '600' },
    signUpBtn: { height: 60, borderRadius: 18, overflow: 'hidden', marginTop: 10 },
    btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    signUpBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    footerLink: { marginTop: 30, alignItems: 'center' },
    footerText: { fontSize: 14, fontWeight: '500' },
    footerBold: { fontWeight: '900' },
    securityBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40 },
    securityText: { fontSize: 11, fontWeight: '500', opacity: 0.6 }
});

export default EmailSignUpScreen;
