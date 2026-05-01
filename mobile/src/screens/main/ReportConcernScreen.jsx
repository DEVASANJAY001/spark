import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ReportConcernScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [type, setType] = useState('Harassment');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const reportTypes = [
        'Harassment',
        'Inappropriate Photos',
        'Spam / Scam',
        'Fake Profile',
        'Underage User',
        'Other'
    ];

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert('Incomplete', 'Please provide a description of your concern.');
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'safety_reports'), {
                reporterId: user.uid,
                type: type,
                description: description,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            setSuccess(true);
            setTimeout(() => {
                navigation.goBack();
            }, 3000);
        } catch (error) {
            console.error('Error submitting safety report:', error);
            Alert.alert('Error', 'Failed to submit report. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name={success ? "checkmark" : "close"} size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {success ? "Report Sent" : "Report Concern"}
                </Text>
                <View style={{ width: 28 }} />
            </View>

            {success ? (
                <View style={styles.successContainer}>
                    <View style={styles.successBadge}>
                        <Ionicons name="shield-checkmark" size={100} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.successTitle, { color: colors.text }]}>Thank You</Text>
                    <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                        Your report has been received. Our safety team will investigate this immediately to keep Spark safe.
                    </Text>
                    <TouchableOpacity 
                        style={[styles.submitBtn, { width: 200, marginTop: 40 }]} 
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.submitText}>Back to Safety</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <Text style={[styles.label, { color: colors.textSecondary }]}>What is the issue?</Text>
                    <View style={styles.typeGrid}>
                        {reportTypes.map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.typeChip,
                                    { backgroundColor: type === t ? COLORS.primary : colors.surface },
                                    type === t && styles.activeChip
                                ]}
                                onPress={() => setType(t)}
                            >
                                <Text style={[
                                    styles.typeText,
                                    { color: type === t ? 'black' : colors.text }
                                ]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: 25 }]}>
                        Description
                    </Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Please provide details about what happened..."
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={6}
                            value={description}
                            onChangeText={setDescription}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#888" />
                        <Text style={styles.infoText}>
                            Your report is confidential. The person you are reporting will not know who reported them.
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={[styles.submitBtn, submitting && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <Text style={styles.submitText}>Submit Report</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    backBtn: {
        padding: 4,
    },
    scrollContent: {
        padding: 25,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 15,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    activeChip: {
        borderColor: 'transparent',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputContainer: {
        borderRadius: 20,
        padding: 15,
        minHeight: 150,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        fontSize: 16,
        lineHeight: 24,
    },
    infoBox: {
        flexDirection: 'row',
        marginTop: 20,
        paddingHorizontal: 10,
        gap: 10,
    },
    infoText: {
        flex: 1,
        color: '#888',
        fontSize: 13,
        lineHeight: 18,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '900',
    },
    disabledBtn: {
        opacity: 0.6,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 60,
    },
    successBadge: {
        marginBottom: 30,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 15,
    },
    successSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    }
});

export default ReportConcernScreen;
