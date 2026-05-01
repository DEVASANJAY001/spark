import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

const CONTENT = {
    reporting: {
        title: 'Reporting & Blocking',
        icon: 'flag',
        sections: [
            {
                title: 'How to Report',
                body: "To report someone, go to their profile, scroll to the bottom, and tap 'Report'. You can also report from a chat by tapping the three dots in the top right corner."
            },
            {
                title: 'What Happens After Reporting',
                body: "Our safety team reviews every report. We take action based on our community guidelines, which can include warnings or permanent account bans."
            },
            {
                title: 'Blocking',
                body: "When you block someone, they will no longer be able to see your profile or send you messages. They won't be notified that you've blocked them."
            }
        ]
    },
    verification: {
        title: 'Photo Verification',
        icon: 'checkmark-circle',
        sections: [
            {
                title: 'Why Verify?',
                body: "Verified profiles show others that you are the person in your photos. It builds trust and increases your chances of getting quality matches."
            },
            {
                title: 'How it Works',
                body: "You'll be asked to take a selfie in a specific pose. Our AI automatically compares this selfie to your profile photos."
            },
            {
                title: 'The Pink Checkmark',
                body: "Once verified, you'll get a pink checkmark on your profile. This is visible to everyone on Spark."
            }
        ]
    },
    privacy: {
        title: 'Privacy Settings',
        icon: 'shield',
        sections: [
            {
                title: 'Who can see me?',
                body: "You can control your visibility in the 'Discovery' section of your settings. You can choose to be shown to everyone, or only people you've liked."
            },
            {
                title: 'Data Protection',
                body: "We use industry-standard encryption to protect your personal data and messages. We never sell your personal information to third parties."
            },
            {
                title: 'Account Privacy',
                body: "You can hide your profile at any time by turning off 'Show me on Spark' in your settings. This won't delete your account but will stop new people from seeing you."
            }
        ]
    }
};

const SafetyInfoScreen = ({ route, navigation }) => {
    const { type } = route.params || { type: 'reporting' };
    const { colors } = useTheme();
    const { profile } = useAuth();
    const info = CONTENT[type] || CONTENT.reporting;
    const isVerified = type === 'verification' && profile?.isVerified;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{info.title}</Text>
                    {isVerified && (
                        <View style={styles.completedBadge}>
                            <Text style={styles.completedText}>COMPLETED</Text>
                        </View>
                    )}
                </View>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '15' }]}>
                        <Ionicons name={info.icon} size={40} color={COLORS.primary} />
                    </View>
                </View>

                {info.sections.map((section, idx) => (
                    <View key={idx} style={styles.infoSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                        <View style={[styles.bodyCard, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{section.body}</Text>
                        </View>
                    </View>
                ))}

                <TouchableOpacity 
                    style={styles.contactBtn}
                    onPress={() => navigation.navigate('SupportTickets')}
                >
                    <Text style={styles.contactBtnText}>Still have questions? Contact Support</Text>
                </TouchableOpacity>
                
                <View style={{ height: 40 }} />
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
        paddingHorizontal: 25,
        paddingTop: 20,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        marginLeft: 4,
    },
    bodyCard: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sectionBody: {
        fontSize: 15,
        lineHeight: 24,
    },
    contactBtn: {
        marginTop: 10,
        padding: 15,
        alignItems: 'center',
    },
    contactBtnText: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    completedBadge: {
        backgroundColor: '#FF3366' + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FF3366',
        marginLeft: 10,
    },
    completedText: {
        color: '#FF3366',
        fontSize: 9,
        fontWeight: '900',
    },
});

export default SafetyInfoScreen;
