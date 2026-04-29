import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const SchoolScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [school, setSchool] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.school) {
            setSchool(profile.school);
        }
    }, [profile]);

    const handleNext = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { school });
            navigation.navigate('LifestyleHabits');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={8 / 13} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <Text style={styles.title}>Where did you go to school?</Text>

                <TextInput
                    style={styles.input}
                    placeholder="School Name"
                    placeholderTextColor={COLORS.lightGrey}
                    value={school}
                    onChangeText={setSchool}
                    editable={!loading}
                />

                <Text style={styles.helperText}>
                    This will appear on your profile.
                </Text>

                <TouchableOpacity
                    style={[styles.nextButton, loading && styles.nextButtonDisabled]}
                    onPress={handleNext}
                    disabled={loading}
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

export default SchoolScreen;