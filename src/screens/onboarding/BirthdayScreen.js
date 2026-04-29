import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const BirthdayScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.birthday) {
            const [d, m, y] = profile.birthday.split('/');
            setDay(d || '');
            setMonth(m || '');
            setYear(y || '');
        }
    }, [profile]);

    const isComplete = day.length === 2 && month.length === 2 && year.length === 4;

    const handleNext = async () => {
        if (!isComplete || !user) return;
        setLoading(true);
        try {
            const birthday = `${day}/${month}/${year}`;
            // Simple age calculation
            const age = new Date().getFullYear() - parseInt(year);
            await userService.saveProfile(user.uid, { birthday, age });
            navigation.navigate('Gender');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={2 / 13} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <Text style={styles.title}>What's your birthday?</Text>

                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="DD"
                        placeholderTextColor={COLORS.lightGrey}
                        keyboardType="number-pad"
                        maxLength={2}
                        value={day}
                        onChangeText={setDay}
                        editable={!loading}
                    />
                    <Text style={styles.separator}>/</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="MM"
                        placeholderTextColor={COLORS.lightGrey}
                        keyboardType="number-pad"
                        maxLength={2}
                        value={month}
                        onChangeText={setMonth}
                        editable={!loading}
                    />
                    <Text style={styles.separator}>/</Text>
                    <TextInput
                        style={[styles.input, { width: 80 }]}
                        placeholder="YYYY"
                        placeholderTextColor={COLORS.lightGrey}
                        keyboardType="number-pad"
                        maxLength={4}
                        value={year}
                        onChangeText={setYear}
                        editable={!loading}
                    />
                </View>

                <Text style={styles.helperText}>
                    Your age will be public.
                </Text>

                <TouchableOpacity
                    style={[styles.nextButton, (!isComplete || loading) && styles.nextButtonDisabled]}
                    disabled={!isComplete || loading}
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
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        borderBottomWidth: 2,
        borderBottomColor: 'white',
        color: 'white',
        fontSize: 24,
        paddingBottom: 5,
        fontWeight: 'bold',
        width: 50,
        textAlign: 'center',
    },
    separator: {
        color: COLORS.lightGrey,
        fontSize: 24,
        marginHorizontal: 10,
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

export default BirthdayScreen;