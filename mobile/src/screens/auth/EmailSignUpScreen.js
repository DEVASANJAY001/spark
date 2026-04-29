import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

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
        console.log('Google Sign-In not available.');
    }
}

const EmailSignUpScreen = ({ navigation }) => {
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
            console.error('Google Sign-Up Error:', error);
            Alert.alert('Sign-Up Failed', error.message || 'Google Sign-In failed. Please try again.');
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
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={30} color={COLORS.lightGrey} />
                    </TouchableOpacity>

                    <Text style={styles.title}>Create Account</Text>

                    {/* Google Sign Up */}
                    <TouchableOpacity
                        style={[styles.googleButton, loading && styles.buttonDisabled]}
                        onPress={handleGoogleSignUp}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color={COLORS.dark} /> : (
                            <>
                                <Ionicons name="logo-google" size={20} color={COLORS.dark} style={styles.googleIcon} />
                                <Text style={styles.googleButtonText}>SIGN UP WITH GOOGLE</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.divider} />
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Email address"
                        placeholderTextColor={COLORS.lightGrey}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        editable={!loading}
                    />

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            placeholder="Password"
                            placeholderTextColor={COLORS.lightGrey}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={COLORS.lightGrey} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            placeholder="Confirm Password"
                            placeholderTextColor={COLORS.lightGrey}
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color={COLORS.lightGrey} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (!email || !password || !confirmPassword || loading) && styles.buttonDisabled]}
                        disabled={!email || !password || !confirmPassword || loading}
                        onPress={handleSignUp}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>SIGN UP</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('EmailLogin')} style={styles.linkContainer}>
                        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Log In</Text></Text>
                    </TouchableOpacity>

                    <Text style={styles.securityText}>
                        Your account security is our priority. We record your IP address {userIP ? `(${userIP})` : ''} for safety and verification purposes.
                    </Text>
                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    content: { flex: 1, paddingHorizontal: SPACING.l, paddingTop: 20, paddingBottom: 40 },
    backButton: { marginBottom: 40 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#3c3c3c', marginBottom: 30 },
    googleButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f8f9fa', paddingVertical: 15, borderRadius: 30,
        borderWidth: 1, borderColor: '#e0e0e0', width: '100%', height: 55, marginBottom: 20,
    },
    googleIcon: { marginRight: 10 },
    googleButtonText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    divider: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
    dividerText: { marginHorizontal: 15, color: COLORS.lightGrey, fontWeight: '600', fontSize: 13 },
    input: {
        borderBottomWidth: 2, borderBottomColor: COLORS.primary,
        fontSize: 18, paddingBottom: 10, marginBottom: 30, color: '#3c3c3c',
    },
    passwordContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: COLORS.primary, marginBottom: 30,
    },
    eyeIcon: { padding: 5 },
    button: {
        backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 30,
        alignItems: 'center', width: '100%', height: 55, justifyContent: 'center', marginTop: 20,
    },
    buttonDisabled: { backgroundColor: '#f0f0f0' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    linkContainer: { marginTop: 30, alignItems: 'center' },
    linkText: { color: COLORS.lightGrey, fontSize: 14 },
    linkHighlight: { color: COLORS.primary, fontWeight: 'bold' },
    securityText: { marginTop: 40, fontSize: 12, color: COLORS.lightGrey, textAlign: 'center', lineHeight: 18 },
});

export default EmailSignUpScreen;
