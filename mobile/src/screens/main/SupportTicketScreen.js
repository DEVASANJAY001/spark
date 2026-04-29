import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import useAuth from '../../hooks/useAuth';
import { supportService } from '../../services/supportService';

const SupportTicketScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('General');
    const [loading, setLoading] = useState(false);

    const categories = ['General', 'Billing', 'Technical', 'Account', 'Other'];

    const handleSubmit = async () => {
        if (!subject.trim() || !message.trim()) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            await supportService.createTicket(
                user.uid,
                user.email || profile?.email || 'N/A',
                subject,
                message,
                category
            );
            Alert.alert('Success', 'Your support ticket has been submitted. We will get back to you soon.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to submit ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Customer Support</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryContainer}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Subject</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Briefly describe the issue"
                    placeholderTextColor="#666"
                    value={subject}
                    onChangeText={setSubject}
                />

                <Text style={styles.label}>Message</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Provide more details..."
                    placeholderTextColor="#666"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={6}
                />

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Submit Ticket</Text>}
                </TouchableOpacity>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#888" />
                    <Text style={styles.infoText}>Typical response time is 24-48 hours. You will be notified via email.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.m, borderBottomWidth: 1, borderBottomColor: '#222' },
    backButton: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
    content: { padding: SPACING.m },
    label: { color: '#888', fontSize: 14, marginBottom: 8, marginTop: 15 },
    categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    categoryPill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#333' },
    categoryPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    categoryText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
    categoryTextActive: { color: 'white' },
    input: { backgroundColor: '#111', borderRadius: 12, padding: 15, color: 'white', borderWidth: 1, borderColor: '#222', fontSize: 16 },
    textArea: { height: 150, textAlignVertical: 'top' },
    submitButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 30 },
    submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    disabledButton: { opacity: 0.7 },
    infoBox: { flexDirection: 'row', alignItems: 'center', marginTop: 30, backgroundColor: '#111', padding: 15, borderRadius: 12, gap: 10 },
    infoText: { color: '#666', fontSize: 12, flex: 1 }
});

export default SupportTicketScreen;
