import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const DistancePreferenceScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [distance, setDistance] = useState(50);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.distancePreference) {
            setDistance(profile.distancePreference);
        }
    }, [profile]);

    const handleNext = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { distancePreference: distance });
            navigation.navigate('RelationshipGoal');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={6 / 13} />

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>Distance</Text>
                    <Text style={styles.distanceValue}>{distance}km</Text>
                </View>

                <Slider
                    style={styles.slider}
                    minimumValue={2}
                    maximumValue={161}
                    step={1}
                    value={distance}
                    onValueChange={setDistance}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.grey}
                    thumbTintColor={COLORS.primary}
                    disabled={loading}
                />

                <Text style={styles.helperText}>
                    We'll use this to find matches in your area.
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.nextButton, loading && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={loading}
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
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    distanceValue: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    helperText: {
        color: COLORS.lightGrey,
        fontSize: 14,
        marginTop: SPACING.m,
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

export default DistancePreferenceScreen;