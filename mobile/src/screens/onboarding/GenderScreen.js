import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const GenderScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [gender, setGender] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.gender) setGender(profile.gender);
    }, [profile]);

    const handleNext = async () => {
        if (!gender || !user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { gender });
            navigation.navigate('SexualOrientation');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const options = [
        { label: 'Man', value: 'Man' },
        { label: 'Woman', value: 'Woman' },
        { label: 'More', value: 'More' },
    ];

    return (
        <OnboardingBase
            title="What's your gender?"
            subtitle="Pick the one that best describes you."
            onNext={handleNext}
            onBack={() => navigation.goBack()}
            loading={loading}
            disabled={!gender}
            progress={0.4}
        >
            <View style={styles.optionsContainer}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        style={[
                            styles.optionButton,
                            gender === option.value && styles.optionButtonActive,
                            { backgroundColor: gender === option.value ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.05)' }
                        ]}
                        onPress={() => setGender(option.value)}
                    >
                        <Text style={[
                            styles.optionText,
                            gender === option.value && styles.optionTextActive
                        ]}>
                            {option.label}
                        </Text>
                        {gender === option.value && (
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

export default GenderScreen;