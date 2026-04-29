import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const RelationshipGoalScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [goal, setGoal] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.relationshipGoal) {
            setGoal(profile.relationshipGoal);
        }
    }, [profile]);

    const options = [
        { id: 'long_term', title: 'Long-term partner', emoji: '💘' },
        { id: 'long_term_open', title: 'Long-term, open to short', emoji: '😍' },
        { id: 'short_term_open', title: 'Short-term, open to long', emoji: '🥂' },
        { id: 'short_term', title: 'Short-term fun', emoji: '🎉' },
        { id: 'friends', title: 'New friends', emoji: '👋' },
        { id: 'figuring_out', title: 'Still figuring it out', emoji: '🤔' },
    ];

    const handleNext = async () => {
        if (!goal || !user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { relationshipGoal: goal });
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

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>What's your relationship goal?</Text>
                <Text style={styles.subtitle}>Help others know what you're looking for!</Text>

                <View style={styles.optionsGrid}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[styles.optionCard, goal === option.id && styles.optionCardActive]}
                            onPress={() => setGoal(option.id)}
                            disabled={loading}
                        >
                            <Text style={styles.emoji}>{option.emoji}</Text>
                            <Text style={[styles.optionTitle, goal === option.id && styles.optionTitleActive]}>
                                {option.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <TouchableOpacity
                style={[styles.nextButton, (!goal || loading) && styles.nextButtonDisabled]}
                disabled={!goal || loading}
                onPress={handleNext}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.dark} />
                ) : (
                    <Text style={styles.nextButtonText}>Next</Text>
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
    content: {
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.l,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginTop: SPACING.l,
    },
    subtitle: {
        color: COLORS.lightGrey,
        fontSize: 16,
        marginTop: 10,
        marginBottom: SPACING.xl,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    optionCard: {
        width: '31%',
        aspectRatio: 0.8,
        backgroundColor: COLORS.grey,
        borderRadius: 15,
        padding: 10,
        marginBottom: SPACING.m,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardActive: {
        borderColor: COLORS.primary,
        backgroundColor: '#2a2a2a',
    },
    emoji: {
        fontSize: 30,
        marginBottom: 10,
    },
    optionTitle: {
        color: 'white',
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '600',
    },
    optionTitleActive: {
        color: COLORS.primary,
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

export default RelationshipGoalScreen;