import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

const EmailSignUpScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userIP, setUserIP] = useState('');

    useEffect(() => {
        fetchIP();
    }, []);

    const fetchIP = async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            setUserIP(data.ip);
            console.log('📍 User IP recorded:', data.ip);
        } catch (error) {
            console.error('Failed to fetch IP:', error);
        }
    };

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            const msg = 'Please fill in all fields.';
            Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
            return;
        }

        if (password !== confirmPassword) {
            const msg = 'Passwords do not match.';
            Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
            return;
        }

        if (password.length < 6) {
            const msg = 'Password must be at least 6 characters.';
            Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
            return;
        }

        setLoading(true);
        let userCreated = null;
        try {
            // 1. Create account first (so we are authenticated to read/write Firestore)
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            userCreated = userCredential.user;

            // 2. Now that we are authenticated, perform Security Checks (IP duplication)
            // No duplication check (Email handled by Firebase)
            const ipQuery = query(collection(db, 'users'), where('registrationIP', '==', userIP));
            const ipSnapshot = await getDocs(ipQuery);

            // Limit to 5 accounts per IP for security
            if (ipSnapshot.size >= 5) {
                // If it's a suspicious IP, delete the account we just made and throw error
                await userCreated.delete();
                throw new Error('Security Alert: Limit exceeded. This network is restricted.');
            }

            // 3. Save user data with IP attribution
            await setDoc(doc(db, 'users', userCreated.uid), {
                uid: userCreated.uid,
                email: userCreated.email,
                createdAt: new Date().toISOString(),
                registrationIP: userIP,
                lastLoginIP: userIP,
                role: 'user',
                onboarded: false
            });

            console.log('✅ User created with IP attribution:', userIP);
        } catch (error) {
            console.error('Sign Up Error:', error);

            // Clean up if something went wrong during Firestore phase
            if (userCreated && error.code !== 'auth/email-already-in-use') {
                try { await userCreated.delete(); } catch (e) { }
            }

            let errorMessage = error.message || 'Failed to create account.';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'This email is already in use.';

            if (Platform.OS === 'web') alert(errorMessage);
            else Alert.alert('Error', errorMessage);
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
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color={COLORS.lightGrey} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (!email || !password || !confirmPassword || loading) && styles.buttonDisabled]}
                        disabled={!email || !password || !confirmPassword || loading}
                        onPress={handleSignUp}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>SIGN UP</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('EmailLogin')}
                        style={styles.linkContainer}
                    >
                        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Log In</Text></Text>
                    </TouchableOpacity>

                    <Text style={styles.securityText}>
                        Your account security is our priority. We record your IP address ({userIP || '...'}) for safety and verification purposes.
                    </Text>
                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.l,
        paddingTop: 20,
        paddingBottom: 40,
    },
    backButton: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3c3c3c',
        marginBottom: 40,
    },
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
        marginBottom: 30,
    },
    eyeIcon: {
        padding: 5,
    },
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
    buttonDisabled: {
        backgroundColor: '#f0f0f0',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    linkContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    linkText: {
        color: COLORS.lightGrey,
        fontSize: 14,
    },
    linkHighlight: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    securityText: {
        marginTop: 40,
        fontSize: 12,
        color: COLORS.lightGrey,
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default EmailSignUpScreen;
