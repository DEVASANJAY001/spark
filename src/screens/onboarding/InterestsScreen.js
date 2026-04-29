import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
import ChipSelector from '../../components/ChipSelector';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const InterestsScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.interests) {
            setSelectedInterests(profile.interests);
        }
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
            navigation.navigate('PhotoUpload');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={11 / 13} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('PhotoUpload')} disabled={loading}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>What are you into?</Text>
                <Text style={styles.helperText}>Add up to 10 interests to your profile.</Text>

                {categories.map((category) => (
                    <View key={category.title} style={styles.section}>
                        <Text style={styles.sectionTitle}>{category.title}</Text>
                        <ChipSelector
                            options={category.options}
                            selectedOptions={selectedInterests}
                            onSelect={handleSelect}
                            multiSelect={true}
                        />
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={[styles.nextButton, (selectedInterests.length === 0 || loading) && styles.nextButtonDisabled]}
                disabled={selectedInterests.length === 0 || loading}
                onPress={handleNext}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.dark} />
                ) : (
                    <Text style={styles.nextButtonText}>Next {selectedInterests.length}/10</Text>
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
        marginBottom: 5,
    },
    helperText: {
        color: COLORS.lightGrey,
        fontSize: 14,
        marginBottom: SPACING.xl,
    },
    section: {
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
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

export default InterestsScreen;