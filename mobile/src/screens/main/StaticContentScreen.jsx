import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../constants/theme';
import { LEGAL_CONTENT } from '../../constants/legalContent';

const StaticContentScreen = ({ navigation, route }) => {
    const { type } = route.params || { type: 'terms_of_service' };
    const content = LEGAL_CONTENT[type] || LEGAL_CONTENT.terms_of_service;

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#1a1a1a', '#000']} style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{content.title}</Text>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.contentText}>{content.content}</Text>

                    {/* Visual filler to make it look premium */}
                    <View style={styles.divider} />
                    <Text style={styles.footerText}>
                        Last updated: April 2026
                    </Text>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 60,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },
    contentText: {
        color: '#ccc',
        fontSize: 16,
        lineHeight: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 30,
    },
    footerText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
    }
});

export default StaticContentScreen;
