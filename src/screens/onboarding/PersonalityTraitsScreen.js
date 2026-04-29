import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import ChipSelector from '../../components/ChipSelector';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const PersonalityTraitsScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [personality, setPersonality] = useState({
        communicationStyle: null,
        loveLanguage: null,
        education: null,
        zodiac: null,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.personality) {
            setPersonality(profile.personality);
        }
    }, [profile]);

    const traits = [
        { key: 'communicationStyle', title: 'Communication style', options: ['Texting', 'Calling', 'In person', 'Video chat'] },
        { key: 'loveLanguage', title: 'How do you receive love?', options: ['Acts of service', 'Gifts', 'Touch', 'Quality time'] },
        { key: 'education', title: 'Education level', options: ['Bachelors', 'Masters', 'PhD', 'High school'] },
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
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={10 / 13} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Interests')} disabled={loading}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>What else makes you—you?</Text>

                {traits.map((trait) => (
                    <View key={trait.key} style={styles.section}>
                        <Text style={styles.sectionTitle}>{trait.title}</Text>
                        <ChipSelector
                            options={trait.options}
                            selectedOptions={personality[trait.key]}
                            onSelect={(val) => setPersonality({ ...personality, [trait.key]: val })}
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

export default PersonalityTraitsScreen;