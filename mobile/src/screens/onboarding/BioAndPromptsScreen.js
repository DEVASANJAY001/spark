import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import ProgressBar from '../../components/ProgressBar';
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

    // Auto-save Bio
    useEffect(() => {
        if (!user || bio === profile?.bio) return;
        const timer = setTimeout(() => {
            userService.updateProfileField(user.uid, 'bio', bio);
        }, 1000);
        return () => clearTimeout(timer);
    }, [bio, user]);

    // Auto-save Prompt
    useEffect(() => {
        if (!user || prompt === profile?.prompt) return;
        const timer = setTimeout(() => {
            userService.updateProfileField(user.uid, 'prompt', prompt);
        }, 1000);
        return () => clearTimeout(timer);
    }, [prompt, user]);

    const handleFinish = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await userService.saveProfile(user.uid, { bio, prompt });
            await userService.completeProfile(user.uid);
            // useAuth listener will detect isProfileComplete change and navigate to Main
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ProgressBar progress={13 / 13} />

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>About me</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>BIO</Text>
                    <TextInput
                        style={styles.bioInput}
                        placeholder="Write a little bit about yourself..."
                        placeholderTextColor={COLORS.lightGrey}
                        multiline
                        numberOfLines={4}
                        value={bio}
                        onChangeText={setBio}
                        editable={!loading}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PROFILE PROMPT</Text>
                    <View style={styles.promptButton}>
                        <Text style={styles.promptText}>I'm the type of person who...</Text>
                        <TextInput
                            style={styles.promptInput}
                            placeholder="Your answer here"
                            placeholderTextColor={COLORS.lightGrey}
                            value={prompt}
                            onChangeText={setPrompt}
                            editable={!loading}
                        />
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity
                style={[styles.nextButton, loading && styles.nextButtonDisabled]}
                onPress={handleFinish}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.dark} />
                ) : (
                    <Text style={styles.nextButtonText}>FINISH</Text>
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
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.l,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginTop: SPACING.l,
        marginBottom: SPACING.xl,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    bioInput: {
        backgroundColor: COLORS.grey,
        borderRadius: 10,
        padding: 15,
        color: 'white',
        fontSize: 16,
        textAlignVertical: 'top',
        height: 120,
    },
    promptButton: {
        backgroundColor: COLORS.grey,
        borderRadius: 10,
        padding: 15,
    },
    promptText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    promptInput: {
        color: 'white',
        fontSize: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGrey,
        paddingBottom: 5,
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

export default BioAndPromptsScreen;