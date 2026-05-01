import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { Ionicons } from '@expo/vector-icons';

const SexualOrientationScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [orientations, setOrientations] = useState([]);
    const [showOrientation, setShowOrientation] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.orientations) setOrientations(profile.orientations);
        if (profile?.showOrientation !== undefined) setShowOrientation(profile.showOrientation);
    }, [profile]);

    const options = [
        { id: 'Straight', title: 'Straight' },
        { id: 'Gay', title: 'Gay' },
        { id: 'Lesbian', title: 'Lesbian' },
        { id: 'Bisexual', title: 'Bisexual' },
        { id: 'Asexual', title: 'Asexual' },
        { id: 'Demisexual', title: 'Demisexual' },
        { id: 'Pansexual', title: 'Pansexual' },
        { id: 'Queer', title: 'Queer' },
    ];

    const handleSelect = (id) => {
        if (orientations.includes(id)) {
            setOrientations(orientations.filter(item => item !== id));
        } else if (orientations.length < 3) {
            setOrientations([...orientations, id]);
        }
    };

    const handleNext = async () => {
        if (orientations.length === 0 || !user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { orientations, showOrientation });
            navigation.navigate('InterestedIn');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingBase
            title="Your orientation?"
            subtitle="Select up to 3 options to help us find better matches."
            onNext={handleNext}
            onBack={() => navigation.goBack()}
            loading={loading}
            disabled={orientations.length === 0}
            progress={0.45}
        >
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                <View style={styles.optionsContainer}>
                    {options.map((option) => {
                        const isSelected = orientations.includes(option.id);
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionButton,
                                    isSelected && styles.optionButtonActive,
                                    { backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.05)' }
                                ]}
                                onPress={() => handleSelect(option.id)}
                            >
                                <Text style={[
                                    styles.optionText,
                                    isSelected && styles.optionTextActive
                                ]}>
                                    {option.title}
                                </Text>
                                {isSelected && (
                                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setShowOrientation(!showOrientation)}
                >
                    <View style={[styles.checkbox, showOrientation && styles.checkboxActive]}>
                        {showOrientation && <Ionicons name="checkmark" size={14} color="white" />}
                    </View>
                    <Text style={styles.checkboxLabel}>Show my orientation on my profile</Text>
                </TouchableOpacity>
            </ScrollView>
        </OnboardingBase>
    );
};

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    optionsContainer: {
        gap: 12,
        marginTop: 10,
    },
    optionButton: {
        height: 55,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionButtonActive: {
        borderColor: COLORS.primary,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },
    optionTextActive: {
        color: 'white',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkboxLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '500',
    }
});

export default SexualOrientationScreen;