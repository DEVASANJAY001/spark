import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const FirstNameScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Preference: 1. Firestore profile, 2. Google/Auth display name
        if (profile?.firstName) {
            setFirstName(profile.firstName);
        } else if (user?.displayName && !firstName) {
            const name = user.displayName.split(' ')[0];
            setFirstName(name);
        }
    }, [user, profile]);

    // Auto-save FirstName
    useEffect(() => {
        if (!user || !firstName || firstName === profile?.firstName) return;
        const timer = setTimeout(() => {
            userService.updateProfileField(user.uid, 'firstName', firstName);
        }, 1000);
        return () => clearTimeout(timer);
    }, [firstName, user]);

    const handleNext = async () => {
        if (!firstName || !user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { firstName });
            navigation.navigate('Birthday');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={1 / 13} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <Text style={styles.title}>What's your first name?</Text>

                <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor={COLORS.lightGrey}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoFocus
                    editable={!loading}
                />

                <Text style={styles.helperText}>
                    This will appear on your profile and you won't be able to change it later.
                </Text>

                <TouchableOpacity
                    style={[styles.nextButton, (!firstName || loading) && styles.nextButtonDisabled]}
                    disabled={!firstName || loading}
                    onPress={handleNext}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.dark} />
                    ) : (
                        <Text style={styles.nextButtonText}>Next</Text>
                    )}
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.dark,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.m,
        paddingTop: SPACING.l,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: SPACING.xl,
    },
    input: {
        borderBottomWidth: 2,
        borderBottomColor: 'white',
        color: 'white',
        fontSize: 24,
        paddingBottom: 5,
        fontWeight: 'bold',
    },
    helperText: {
        color: COLORS.lightGrey,
        fontSize: 14,
        marginTop: 15,
    },
    nextButton: {
        backgroundColor: 'white',
        marginTop: SPACING.xl,
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        height: 55,
        justifyContent: 'center',
    },
    nextButtonDisabled: {
        backgroundColor: COLORS.grey,
    },
    nextButtonText: {
        color: COLORS.dark,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default FirstNameScreen;