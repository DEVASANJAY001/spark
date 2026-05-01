import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
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
        if (profile?.lifestyle) setLifestyle(profile.lifestyle);
    }, [profile]);

    const habits = [
        { key: 'drinking', title: 'Drinking', options: ['Socially', 'Never', 'Frequently', 'Sober'] },
        { key: 'smoking', title: 'Smoking', options: ['Socially', 'Never', 'Frequently', 'Regularly'] },
        { key: 'workout', title: 'Workout', options: ['Every day', 'Often', 'Sometimes', 'Never'] },
        { key: 'pets', title: 'Pets', options: ['Dog', 'Cat', 'Reptile', 'None'] },
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
        <OnboardingBase
            title="Lifestyle"
            subtitle="Tell us a bit about your daily habits."
            onNext={handleNext}
            onBack={() => navigation.goBack()}
            loading={loading}
            progress={0.75}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                {habits.map((habit) => (
                    <View key={habit.key} style={styles.section}>
                        <Text style={styles.sectionTitle}>{habit.title}</Text>
                        <View style={styles.chipGrid}>
                            {habit.options.map(option => {
                                const isSelected = lifestyle[habit.key] === option;
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.chip,
                                            isSelected && styles.chipActive,
                                            { backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.05)' }
                                        ]}
                                        onPress={() => setLifestyle({ ...lifestyle, [habit.key]: option })}
                                    >
                                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </OnboardingBase>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 15,
        marginLeft: 5,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    chipActive: {
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    chipTextActive: {
        color: 'white',
    }
});

export default LifestyleHabitsScreen;