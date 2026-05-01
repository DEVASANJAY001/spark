import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const InterestsScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.interests) setSelectedInterests(profile.interests);
    }, [profile]);

    const categories = [
        { title: 'Creativity', options: ['Art', 'Design', 'Photography', 'Writing', 'Music'] },
        { title: 'Food and drink', options: ['Cooking', 'Coffee', 'Wine', 'Beer', 'Pizza', 'Sushi'] },
        { title: 'Gaming', options: ['Video games', 'Board games', 'Card games', 'ESports'] },
        { title: 'Going out', options: ['Parties', 'Concerts', 'Movies', 'Theater', 'Nightclubs'] },
    ];

    const handleSelect = (interest) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else if (selectedInterests.length < 10) {
            setSelectedInterests([...selectedInterests, interest]);
        }
    };

    const handleNext = async () => {
        if (selectedInterests.length === 0 || !user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { interests: selectedInterests });
            navigation.navigate('BioAndPrompts');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingBase
            title="Interests"
            subtitle="Pick up to 10 things you love. It helps us find common ground."
            onNext={handleNext}
            onBack={() => navigation.goBack()}
            loading={loading}
            disabled={selectedInterests.length === 0}
            progress={0.85}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                {categories.map((category) => (
                    <View key={category.title} style={styles.section}>
                        <Text style={styles.sectionTitle}>{category.title}</Text>
                        <View style={styles.chipGrid}>
                            {category.options.map(option => {
                                const isSelected = selectedInterests.includes(option);
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.chip,
                                            isSelected && styles.chipActive,
                                            { backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.05)' }
                                        ]}
                                        onPress={() => handleSelect(option)}
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

export default InterestsScreen;