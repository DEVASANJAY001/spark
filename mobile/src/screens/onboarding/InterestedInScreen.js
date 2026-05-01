import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const InterestedInScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [interestedIn, setInterestedIn] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.interestedIn) setInterestedIn(profile.interestedIn);
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

    const options = [
        { label: 'Women', value: 'Women' },
        { label: 'Men', value: 'Men' },
        { label: 'Everyone', value: 'Everyone' },
    ];

    return (
        <OnboardingBase
            title="Who do you want to see?"
            subtitle="You can always change this later in settings."
            onNext={handleNext}
            onBack={() => navigation.goBack()}
            loading={loading}
            disabled={!interestedIn}
            progress={0.5}
        >
            <View style={styles.optionsContainer}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        style={[
                            styles.optionButton,
                            interestedIn === option.value && styles.optionButtonActive,
                            { backgroundColor: interestedIn === option.value ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.05)' }
                        ]}
                        onPress={() => setInterestedIn(option.value)}
                    >
                        <Text style={[
                            styles.optionText,
                            interestedIn === option.value && styles.optionTextActive
                        ]}>
                            {option.label}
                        </Text>
                        {interestedIn === option.value && (
                            <View style={styles.radioActive} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </OnboardingBase>
    );
};

const styles = StyleSheet.create({
    optionsContainer: {
        gap: 15,
        marginTop: 10,
    },
    optionButton: {
        height: 65,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    optionButtonActive: {
        borderColor: COLORS.primary,
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },
    optionTextActive: {
        color: 'white',
    },
    radioActive: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    }
});

export default InterestedInScreen;