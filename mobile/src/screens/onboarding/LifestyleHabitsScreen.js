import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import ChipSelector from '../../components/ChipSelector';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const LifestyleHabitsScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [lifestyle, setLifestyle] = useState({
        drinking: null,
        smoking: null,
        workout: null,
        pets: null,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.lifestyle) {
            setLifestyle(profile.lifestyle);
        }
    }, [profile]);

    const habits = [
        { key: 'drinking', title: 'How often do you drink?', options: ['Socially', 'Never', 'Frequently', 'Sober'] },
        { key: 'smoking', title: 'How often do you smoke?', options: ['Socially', 'Never', 'Frequently', 'Regularly'] },
        { key: 'workout', title: 'Do you workout?', options: ['Every day', 'Often', 'Sometimes', 'Never'] },
        { key: 'pets', title: 'Do you have any pets?', options: ['Dog', 'Cat', 'Reptile', 'None'] },
    ];

    const filledCount = Object.values(lifestyle).filter(val => val !== null).length;

    const handleNext = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { lifestyle });
            navigation.navigate('PersonalityTraits');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={9 / 13} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('PersonalityTraits')} disabled={loading}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Let's talk lifestyle habits</Text>

                {habits.map((habit) => (
                    <View key={habit.key} style={styles.section}>
                        <Text style={styles.sectionTitle}>{habit.title}</Text>
                        <ChipSelector
                            options={habit.options}
                            selectedOptions={lifestyle[habit.key]}
                            onSelect={(val) => setLifestyle({ ...lifestyle, [habit.key]: val })}
                        />
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={[styles.nextButton, loading && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.dark} />
                ) : (
                    <Text style={styles.nextButtonText}>Next {filledCount}/4</Text>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.dark,
    },
    header: {
        padding: SPACING.m,
        alignItems: 'flex-end',
    },
    skipText: {
        color: COLORS.lightGrey,
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.l,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: SPACING.xl,
    },
    section: {
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
    },
    nextButton: {
        backgroundColor: 'white',
        margin: SPACING.m,
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

export default LifestyleHabitsScreen;