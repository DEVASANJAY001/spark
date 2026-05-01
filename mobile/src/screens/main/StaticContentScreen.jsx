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

    const renderFormattedContent = (text) => {
        if (!text) return null;
        
        // Split by lines and parse for headers or bullet points
        const lines = text.split('\n');
        return lines.map((line, index) => {
            const trimmed = line.trim();
            
            // Check if it's a section header (e.g., "1. INTRODUCTION" or "OUR WORK")
            if (/^[0-9]+\. [A-Z ]+$/.test(trimmed) || /^[A-Z ]{5,30}$/.test(trimmed)) {
                return (
                    <Text key={index} style={styles.sectionHeader}>
                        {trimmed}
                    </Text>
                );
            }
            
            // Check if it's a list item
            if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                return (
                    <View key={index} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listText}>{trimmed.substring(1).trim()}</Text>
                    </View>
                );
            }
            
            // Regular paragraph
            if (trimmed === '') return <View key={index} style={{ height: 15 }} />;
            
            return (
                <Text key={index} style={styles.paragraph}>
                    {trimmed}
                </Text>
            );
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{content.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.contentWrapper}>
                    {renderFormattedContent(content.content)}
                </View>

                <View style={styles.footer}>
                    <View style={styles.divider} />
                    <Text style={styles.footerText}>
                        © 2026 DAVNS Industries. All rights reserved.
                    </Text>
                    <Text style={styles.lastUpdated}>
                        Last updated: May 2026
                    </Text>
                </View>
            </ScrollView>
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
        paddingHorizontal: 15,
        height: 64,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 60,
    },
    contentWrapper: {
        marginBottom: 40,
    },
    sectionHeader: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
        marginTop: 30,
        marginBottom: 15,
        textTransform: 'uppercase',
    },
    paragraph: {
        color: '#aaa',
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '500',
        marginBottom: 10,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingLeft: 5,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginTop: 10,
        marginRight: 12,
    },
    listText: {
        color: '#aaa',
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '500',
        flex: 1,
    },
    footer: {
        alignItems: 'center',
    },
    divider: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#222',
        marginBottom: 20,
    },
    footerText: {
        color: '#666',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    lastUpdated: {
        color: '#444',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});

export default StaticContentScreen;
