import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../firebase/config';

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
        console.log('Google Sign-In native module not available.');
    }
}

const EmailLoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        if (!GoogleSignin) {
            Alert.alert(
                'Development Build Required',
                'Google Sign-In requires a native development build. Please run: npx expo run:android or npx expo run:ios\n\nOr use Email login instead.'
            );
            return;
        }
        setLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();

            // v13+ API returns { type: 'success' | 'cancelled', data: { idToken, ... } }
            if (response.type === 'cancelled') {
                setLoading(false);
                return;
            }

            const idToken = response.data?.idToken ?? response.idToken;
            if (!idToken) {
                throw new Error('No ID token returned from Google Sign-In.');
            }

            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, credential);
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            Alert.alert('Sign-In Failed', error.message || 'Google Sign-In failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Login Error:', error);
            let errorMessage = 'Failed to login. Please check your credentials.';
            if (error.code === 'auth/user-not-found') errorMessage = 'No account found with this email.';
            if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password.';
            if (error.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password.';
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={30} color={COLORS.lightGrey} />
                </TouchableOpacity>

                <Text style={styles.title}>Welcome back!</Text>

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
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={COLORS.lightGrey} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, (!email || !password || loading) && styles.buttonDisabled]}
                    disabled={!email || !password || loading}
                    onPress={handleLogin}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>LOG IN</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.divider} />
                </View>

                <TouchableOpacity
                    style={[styles.googleButton, loading && styles.buttonDisabled]}
                    disabled={loading}
                    onPress={handleGoogleSignIn}
                >
                    <Ionicons name="logo-google" size={20} color={COLORS.dark} style={styles.googleIcon} />
                    <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('EmailSignUp')}
                    style={styles.linkContainer}
                >
                    <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text></Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    content: { flex: 1, paddingHorizontal: SPACING.l, paddingTop: 20 },
    backButton: { marginBottom: 40 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#3c3c3c', marginBottom: 40 },
    input: {
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
        fontSize: 18,
        paddingBottom: 10,
        marginBottom: 30,
        color: '#3c3c3c',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
        marginBottom: 40,
    },
    eyeIcon: { padding: 5 },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        width: '100%',
        height: 55,
        justifyContent: 'center',
        marginTop: 20,
    },
    buttonDisabled: { backgroundColor: '#f0f0f0' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
    divider: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
    dividerText: { marginHorizontal: 15, color: COLORS.lightGrey, fontWeight: '600' },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 55,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    googleIcon: { marginRight: 10 },
    googleButtonText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
    linkContainer: { marginTop: 30, alignItems: 'center' },
    linkText: { color: COLORS.lightGrey, fontSize: 14 },
    linkHighlight: { color: COLORS.primary, fontWeight: 'bold' },
});

export default EmailLoginScreen;
