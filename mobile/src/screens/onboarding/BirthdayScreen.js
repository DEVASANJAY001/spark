import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const BirthdayScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.birthday) {
            const [d, m, y] = profile.birthday.split('/');
            setDay(d || '');
            setMonth(m || '');
            setYear(y || '');
        }
    }, [profile]);

    const isComplete = day.length === 2 && month.length === 2 && year.length === 4;

    const handleNext = async () => {
        if (!isComplete || !user) return;
        setLoading(true);
        try {
            const birthday = `${day}/${month}/${year}`;
            const [d, m, y] = [parseInt(day), parseInt(month), parseInt(year)];
            const birthDate = new Date(y, m - 1, d);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
            
            await userService.saveProfile(user.uid, { birthday, age });
            navigation.navigate('Gender');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingBase
            title="When's your birthday?"
            subtitle="Your age will be public. Choose wisely, you can only set this once."
            onNext={handleNext}
            onBack={() => navigation.goBack()}
            loading={loading}
            disabled={!isComplete}
            progress={0.3}
        >
            <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Day</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="DD"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        keyboardType="number-pad"
                        maxLength={2}
                        value={day}
                        onChangeText={setDay}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Month</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="MM"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        keyboardType="number-pad"
                        maxLength={2}
                        value={month}
                        onChangeText={setMonth}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1.5 }]}>
                    <Text style={styles.inputLabel}>Year</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="YYYY"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        keyboardType="number-pad"
                        maxLength={4}
                        value={year}
                        onChangeText={setYear}
                    />
                </View>
            </View>
        </OnboardingBase>
    );
};

const styles = StyleSheet.create({
    inputRow: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 20,
    },
    inputGroup: {
        flex: 1,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
        paddingBottom: 5,
    },
    inputLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    input: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    }
});

export default BirthdayScreen;