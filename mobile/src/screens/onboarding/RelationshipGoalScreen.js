import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const RelationshipGoalScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [goal, setGoal] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.relationshipGoal) setGoal(profile.relationshipGoal);
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
        <OnboardingBase
            title="What's your goal?"
            subtitle="Let others know what kind of connection you're looking for."
            onNext={handleNext}
            onBack={() => navigation.goBack()}
            loading={loading}
            disabled={!goal}
            progress={0.65}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {options.map((option) => {
                        const isSelected = goal === option.id;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.card,
                                    isSelected && styles.cardActive,
                                    { backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.05)' }
                                ]}
                                onPress={() => setGoal(option.id)}
                            >
                                <Text style={styles.emoji}>{option.emoji}</Text>
                                <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                                    {option.title}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </OnboardingBase>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 10,
        paddingBottom: 20,
    },
    card: {
        width: '48%',
        height: 140,
        borderRadius: 20,
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    cardActive: {
        borderColor: COLORS.primary,
    },
    emoji: {
        fontSize: 32,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 18,
    },
    cardTitleActive: {
        color: 'white',
    }
});

export default RelationshipGoalScreen;