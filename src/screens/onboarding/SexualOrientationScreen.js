import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const SexualOrientationScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [orientations, setOrientations] = useState([]);
    const [showOrientation, setShowOrientation] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.orientations) {
            setOrientations(profile.orientations);
        }
        if (profile?.showOrientation !== undefined) {
            setShowOrientation(profile.showOrientation);
        }
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
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={4 / 13} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('InterestedIn')} disabled={loading}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>What's your sexual orientation?</Text>
                <Text style={styles.helperText}>Select up to 3</Text>

                <View style={styles.optionsContainer}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionButton,
                                orientations.includes(option.id) && styles.optionButtonActive
                            ]}
                            onPress={() => handleSelect(option.id)}
                            disabled={loading}
                        >
                            <Text style={[
                                styles.optionText,
                                orientations.includes(option.id) && styles.optionTextActive
                            ]}>
                                {option.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setShowOrientation(!showOrientation)}
                    disabled={loading}
                >
                    <View style={[styles.checkbox, showOrientation && styles.checkboxActive]} />
                    <Text style={styles.checkboxLabel}>Show my orientation on my profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.nextButton, (orientations.length === 0 || loading) && styles.nextButtonDisabled]}
                    disabled={orientations.length === 0 || loading}
                    onPress={handleNext}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.dark} />
                    ) : (
                        <Text style={styles.nextButtonText}>Next</Text>
                    )}
                </TouchableOpacity>
            </View>
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
        marginBottom: 10,
    },
    helperText: {
        color: COLORS.lightGrey,
        fontSize: 14,
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
        marginBottom: SPACING.s,
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
    footer: {
        padding: SPACING.m,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: COLORS.grey,
        borderRadius: 4,
        marginRight: 10,
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkboxLabel: {
        color: 'white',
        fontSize: 14,
    },
    nextButton: {
        backgroundColor: 'white',
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

export default SexualOrientationScreen;