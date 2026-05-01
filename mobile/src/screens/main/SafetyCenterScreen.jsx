import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import useAuth from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

const SafetyCenterScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { profile } = useAuth();

    const safetyTips = [
        {
            title: 'Meeting in Person',
            desc: 'Always meet in a public place and let a friend know where you are.',
            icon: 'people-outline',
            color: '#FF4B6E'
        },
        {
            title: 'Protect Your Info',
            desc: "Don't share your home address, financial info, or work location too early.",
            icon: 'lock-closed-outline',
            color: '#4DA1FF'
        },
        {
            title: 'Trust Your Gut',
            desc: "If something feels off, it probably is. You're never obligated to stay.",
            icon: 'flash-outline',
            color: '#FFD700'
        }
    ];

    const safetyTools = [
        {
            title: 'Reporting & Blocking',
            desc: 'Learn how to report suspicious or abusive behavior.',
            icon: 'flag-outline'
        },
        {
            title: 'Photo Verification',
            desc: 'See how to get verified and look for the blue checkmark.',
            icon: 'checkmark-circle-outline'
        },
        {
            title: 'Privacy Settings',
            desc: 'Control who sees your profile and how you interact.',
            icon: 'shield-outline'
        }
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Safety Center</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <LinearGradient
                        colors={['rgba(0, 232, 130, 0.15)', 'rgba(77, 161, 255, 0.15)']}
                        style={styles.heroGradient}
                    >
                        <Ionicons name="shield-checkmark" size={60} color="#00e882" />
                        <Text style={[styles.heroTitle, { color: colors.text }]}>Your safety is our priority</Text>
                        <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                            We're here to help you have a safe and positive experience on Spark.
                        </Text>
                    </LinearGradient>
                </View>

                {/* Safety Tips */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Tips</Text>
                    {safetyTips.map((tip, idx) => (
                        <View key={idx} style={[styles.tipCard, { backgroundColor: colors.surface }]}>
                            <View style={[styles.tipIconWrap, { backgroundColor: tip.color + '20' }]}>
                                <Ionicons name={tip.icon} size={24} color={tip.color} />
                            </View>
                            <View style={styles.tipTextWrap}>
                                <Text style={[styles.tipTitle, { color: colors.text }]}>{tip.title}</Text>
                                <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>{tip.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Tools & Resources */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Tools & Resources</Text>
                    {safetyTools.map((tool, index) => {
                        const isVerifiedTool = tool.title === 'Photo Verification' && profile?.isVerified;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.toolCard, { backgroundColor: colors.surface }]}
                                onPress={() => {
                                    if (tool.title === 'Reporting & Blocking') {
                                        navigation.navigate('SafetyInfo', { type: 'reporting' });
                                    } else if (tool.title === 'Photo Verification') {
                                        navigation.navigate('PhotoVerification');
                                    } else if (tool.title === 'Privacy Settings') {
                                        navigation.navigate('SafetyInfo', { type: 'privacy' });
                                    }
                                }}
                            >
                                <View style={[styles.toolIconWrap, { backgroundColor: (isVerifiedTool ? '#FF3366' : tool.color) + '15' }]}>
                                    <Ionicons 
                                        name={isVerifiedTool ? "checkmark-circle" : tool.icon} 
                                        size={24} 
                                        color={isVerifiedTool ? '#FF3366' : tool.color} 
                                    />
                                </View>
                                <View style={styles.toolContent}>
                                    <Text style={[styles.toolTitle, { color: colors.text }]}>{isVerifiedTool ? 'Verified Account' : tool.title}</Text>
                                    <Text style={[styles.toolDesc, { color: isVerifiedTool ? '#FF3366' : colors.textSecondary }]}>
                                        {isVerifiedTool ? 'Status: Completed' : tool.description}
                                    </Text>
                                </View>
                                {isVerifiedTool ? (
                                    <View style={styles.completedBadge}>
                                        <Text style={styles.completedText}>DONE</Text>
                                    </View>
                                ) : (
                                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Report Action */}
                <TouchableOpacity 
                    style={styles.reportBtn}
                    onPress={() => navigation.navigate('ReportConcern')}
                >
                    <LinearGradient
                        colors={[COLORS.primary, '#FF4B6E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.reportGradient}
                    >
                        <Text style={styles.reportText}>Report a Safety Concern</Text>
                    </LinearGradient>
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
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    heroSection: {
        marginBottom: 30,
        borderRadius: 24,
        overflow: 'hidden',
    },
    heroGradient: {
        padding: 30,
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '900',
        marginTop: 15,
        textAlign: 'center',
    },
    heroSub: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 15,
    },
    tipCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    tipIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipTextWrap: {
        flex: 1,
        marginLeft: 15,
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    tipDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    toolCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    toolIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toolContent: {
        flex: 1,
        marginLeft: 15,
    },
    toolTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    toolDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    completedBadge: {
        backgroundColor: '#FF3366' + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF3366',
    },
    completedText: {
        color: '#FF3366',
        fontSize: 10,
        fontWeight: '900',
    },
    reportBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 10,
    },
    reportGradient: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    }
});

export default SafetyCenterScreen;
