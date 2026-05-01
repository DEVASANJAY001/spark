import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const FirstNameScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.firstName) {
            setFirstName(profile.firstName);
        } else if (user?.displayName && !firstName) {
            const name = user.displayName.split(' ')[0];
            setFirstName(name);
        }
    }, [user, profile]);

    const handleNext = async () => {
        if (!firstName || !user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { firstName });
            navigation.navigate('Birthday');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingBase
            title="What's your name?"
            subtitle="This is how you'll appear on Spark. You won't be able to change this later."
            onNext={handleNext}
            onBack={() => navigation.goBack()}
            loading={loading}
            disabled={!firstName || firstName.length < 2}
            progress={0.15}
        >
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoFocus
                    editable={!loading}
                    selectionColor={COLORS.primary}
                />
            </View>
        </OnboardingBase>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        marginTop: 20,
    },
    input: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
        paddingBottom: 10,
    }
});

export default FirstNameScreen;