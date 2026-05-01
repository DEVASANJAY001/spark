import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const DistancePreferenceScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [distance, setDistance] = useState(50);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.distancePreference) setDistance(profile.distancePreference);
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
        <OnboardingBase
            title="Max distance?"
            subtitle="Choose the maximum distance you're willing to travel to meet someone."
            onNext={handleNext}
            onBack={() => navigation.goBack()}
            loading={loading}
            progress={0.6}
        >
            <View style={styles.sliderContainer}>
                <View style={styles.valueRow}>
                    <Text style={styles.valueText}>{distance}</Text>
                    <Text style={styles.unitText}>KM</Text>
                </View>
                
                <Slider
                    style={styles.slider}
                    minimumValue={2}
                    maximumValue={161}
                    step={1}
                    value={distance}
                    onValueChange={setDistance}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor="rgba(255,255,255,0.1)"
                    thumbTintColor="white"
                />

                <View style={styles.rangeLabels}>
                    <Text style={styles.rangeText}>2 KM</Text>
                    <Text style={styles.rangeText}>161 KM</Text>
                </View>
            </View>
        </OnboardingBase>
    );
};

const styles = StyleSheet.create({
    sliderContainer: {
        marginTop: 40,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: 30,
    },
    valueText: {
        fontSize: 72,
        fontWeight: '900',
        color: 'white',
    },
    unitText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginLeft: 10,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    rangeLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    rangeText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: 'bold',
    }
});

export default DistancePreferenceScreen;