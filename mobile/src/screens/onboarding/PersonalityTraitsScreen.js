import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const PersonalityTraitsScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [personality, setPersonality] = useState({
        communicationStyle: null,
        loveLanguage: null,
        zodiac: null,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.personality) setPersonality(profile.personality);
    }, [profile]);

    const traits = [
        { key: 'communicationStyle', title: 'Communication style', options: ['Texting', 'Calling', 'In person', 'Video chat'] },
        { key: 'loveLanguage', title: 'Love language', options: ['Acts of service', 'Gifts', 'Touch', 'Quality time'] },
        { key: 'zodiac', title: 'Zodiac sign', options: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] },
    ];

    const filledCount = Object.values(personality).filter(val => val !== null).length;

    const handleNext = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { personality });
            navigation.navigate('Interests');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingBase
            title="Traits"
            subtitle="What else makes you—you? This helps us find your frequency."
            onNext={handleNext}
            onBack={() => navigation.goBack()}
            loading={loading}
            progress={0.8}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                {traits.map((trait) => (
                    <View key={trait.key} style={styles.section}>
                        <Text style={styles.sectionTitle}>{trait.title}</Text>
                        <View style={styles.chipGrid}>
                            {trait.options.map(option => {
                                const isSelected = personality[trait.key] === option;
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.chip,
                                            isSelected && styles.chipActive,
                                            { backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.05)' }
                                        ]}
                                        onPress={() => setPersonality({ ...personality, [trait.key]: option })}
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

export default PersonalityTraitsScreen;