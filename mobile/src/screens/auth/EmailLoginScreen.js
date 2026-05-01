import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../firebase/config';
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

const EmailLoginScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
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
            console.error('Google Sign-In Error:', error);
            Alert.alert('Sign-In Failed', error.message || 'Google Sign-In failed.');
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />
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
                        <Text style={[styles.title, { color: colors.text }]}>Member Login</Text>
                    </View>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
                            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your email"
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
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PASSWORD</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Enter your password"
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

                    <TouchableOpacity style={styles.forgotBtn}>
                        <Text style={[styles.forgotText, { color: COLORS.primary }]}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginBtn}
                        disabled={loading}
                        onPress={handleLogin}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, '#FF3366']}
                            style={styles.btnGradient}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginBtnText}>LOG IN</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR CONTINUE WITH</Text>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    </View>

                    <TouchableOpacity
                        style={[styles.googleBtn, { backgroundColor: colors.surface }]}
                        onPress={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <Ionicons name="logo-google" size={18} color={colors.text} />
                        <Text style={[styles.googleBtnText, { color: colors.text }]}>GOOGLE ACCOUNT</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate('EmailSignUp')}
                    style={styles.footerLink}
                >
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        New to Spark? <Text style={[styles.footerBold, { color: COLORS.primary }]}>Create Account</Text>
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 25 },
    header: { marginTop: 20, marginBottom: 40, flexDirection: 'row', alignItems: 'center', gap: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    headerTitleBox: { flex: 1 },
    brandLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    form: { gap: 20 },
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
    forgotBtn: { alignSelf: 'flex-end', marginTop: -5 },
    forgotText: { fontSize: 13, fontWeight: '800' },
    loginBtn: { height: 60, borderRadius: 18, overflow: 'hidden', marginTop: 10 },
    btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loginBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginVertical: 15 },
    divider: { flex: 1, height: 1, opacity: 0.3 },
    dividerText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
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
    footerLink: { marginTop: 40, alignItems: 'center' },
    footerText: { fontSize: 14, fontWeight: '500' },
    footerBold: { fontWeight: '900' },
});

export default EmailLoginScreen;

