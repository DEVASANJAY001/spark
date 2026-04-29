import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const InterestedInScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [interestedIn, setInterestedIn] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.interestedIn) {
            setInterestedIn(profile.interestedIn);
        }
    }, [profile]);

    const handleNext = async () => {
        if (!interestedIn || !user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { interestedIn });
            navigation.navigate('DistancePreference');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={5 / 13} />

            <View style={styles.content}>
                <Text style={styles.title}>Who do you want to see?</Text>

                <View style={styles.optionsContainer}>
                    {['Women', 'Men', 'Everyone'].map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[styles.optionButton, interestedIn === option && styles.optionButtonActive]}
                            onPress={() => setInterestedIn(option)}
                            disabled={loading}
                        >
                            <Text style={[styles.optionText, interestedIn === option && styles.optionTextActive]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity
                style={[styles.nextButton, (!interestedIn || loading) && styles.nextButtonDisabled]}
                disabled={!interestedIn || loading}
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
    optionsContainer: {
        marginBottom: SPACING.xl,
    },
    optionButton: {
        borderWidth: 2,
        borderColor: COLORS.grey,
        borderRadius: 30,
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginBottom: SPACING.m,
    },
    optionButtonActive: {
        borderColor: COLORS.primary,
    },
    optionText: {
        color: COLORS.lightGrey,
        fontSize: 18,
        fontWeight: '600',
    },
    optionTextActive: {
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

export default InterestedInScreen;