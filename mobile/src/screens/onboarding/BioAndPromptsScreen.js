import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import OnboardingBase from '../../components/OnboardingBase';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';

const BioAndPromptsScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [bio, setBio] = useState('');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.bio) setBio(profile.bio);
        if (profile?.prompt) setPrompt(profile.prompt);
    }, [profile]);

    const handleFinish = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { bio, prompt });
            await userService.completeProfile(user.uid);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingBase
            title="Bio & Prompts"
            subtitle="The last step! Tell us about yourself and answer a quick prompt."
            onNext={handleFinish}
            onBack={() => navigation.goBack()}
            loading={loading}
            progress={0.95}
            nextLabel="FINISH"
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.label}>BIO</Text>
                    <TextInput
                        style={styles.bioInput}
                        placeholder="Share something interesting..."
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        multiline
                        value={bio}
                        onChangeText={setBio}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>PROMPT</Text>
                    <View style={styles.promptCard}>
                        <Text style={styles.promptTitle}>I'm the type of person who...</Text>
                        <TextInput
                            style={styles.promptInput}
                            placeholder="Your answer here"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            value={prompt}
                            onChangeText={setPrompt}
                        />
                    </View>
                </View>
            </ScrollView>
        </OnboardingBase>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 30,
    },
    label: {
        fontSize: 12,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 5,
    },
    bioInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        color: 'white',
        fontSize: 16,
        height: 150,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    promptCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    promptTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
    },
    promptInput: {
        fontSize: 18,
        color: 'white',
        fontWeight: '600',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    }
});

export default BioAndPromptsScreen;