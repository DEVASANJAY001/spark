import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Share, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import UsernameModal from '../../components/UsernameModal';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const [profile, setProfile] = useState(null);
    const [usernameVisible, setUsernameVisible] = useState(false);

    useEffect(() => {
        if (user) {
            const unsubscribe = userService.subscribeToProfile(user.uid, (data) => {
                setProfile(data);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const calculateAge = (profile) => {
        if (profile?.age) return profile.age;
        if (!profile?.birthday) return '21';
        
        const birthday = profile.birthday;
        let birthDate;
        if (typeof birthday === 'string') {
            if (birthday.includes('/')) {
                const [d, m, y] = birthday.split('/');
                birthDate = new Date(y, m - 1, d);
            } else {
                birthDate = new Date(birthday);
            }
        } else if (birthday.seconds) { // Firestore timestamp
            birthDate = new Date(birthday.seconds * 1000);
        } else {
            birthDate = new Date(birthday);
        }

        if (isNaN(birthDate.getTime())) return '21';

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'Check out Spark - Find your perfect match!',
                url: 'https://sparkapp.com'
            });
        } catch (error) {
            console.error(error.message);
        }
    };

    const photoUrl = profile?.photos?.[0] || 'https://picsum.photos/400';
    const profileAge = calculateAge(profile);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Minimal Header */}
            <View style={styles.header}>
                <Text style={[styles.headerLogo, { color: COLORS.primary }]}>SPARK</Text>
                <TouchableOpacity 
                    style={[styles.headerBtn, { backgroundColor: colors.surface }]}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Ionicons name="settings-sharp" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Hero Profile Card */}
                <View style={styles.heroSection}>
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={[COLORS.primary, '#9C27B0']}
                            style={styles.avatarBorder}
                        >
                            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
                        </LinearGradient>
                        <TouchableOpacity 
                            style={styles.editBadge}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Ionicons name="pencil" size={16} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoBox}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.nameText, { color: colors.text }]}>
                                {profile?.firstName || 'User'}, {profileAge}
                            </Text>
                            {profile?.isVerified && (
                                <View style={styles.verifiedIconWrap}>
                                    <Ionicons name="checkmark-seal" size={22} color={COLORS.primary} />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                            {profile?.jobTitle || 'Spark Explorer'}
                        </Text>
                    </View>
                </View>

                {/* Quick Stats / Actions */}
                <View style={styles.statsRow}>
                    <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('EditProfile')}>
                        <LinearGradient colors={['#FF6B6B', '#FF3366']} style={styles.statIconWrap}>
                            <Ionicons name="images" size={22} color="white" />
                        </LinearGradient>
                        <Text style={[styles.statLabel, { color: colors.text }]}>Media</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Subscription')}>
                        <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.statIconWrap}>
                            <Ionicons name="flash" size={22} color="white" />
                        </LinearGradient>
                        <Text style={[styles.statLabel, { color: colors.text }]}>Boosts</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statItem} onPress={handleShare}>
                        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.statIconWrap}>
                            <Ionicons name="share-social" size={22} color="white" />
                        </LinearGradient>
                        <Text style={[styles.statLabel, { color: colors.text }]}>Invite</Text>
                    </TouchableOpacity>
                </View>

                {/* Dynamic Content Banners */}
                <View style={styles.bannerContainer}>
                    
                    {/* Completion Tracker */}
                    <View style={[styles.glassCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Profile Strength</Text>
                            <Text style={[styles.cardValue, { color: COLORS.primary }]}>85%</Text>
                        </View>
                        <View style={[styles.progressBarBase, { backgroundColor: colors.border }]}>
                            <LinearGradient 
                                colors={[COLORS.primary, '#FF1493']} 
                                start={{x:0, y:0}} end={{x:1, y:0}}
                                style={[styles.progressBarFill, { width: '85%' }]} 
                            />
                        </View>
                        <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                            Add more photos to get 3x more matches!
                        </Text>
                    </View>

                    {/* Username Banner */}
                    {!profile?.username && (
                        <TouchableOpacity 
                            style={styles.promoBanner}
                            onPress={() => setUsernameVisible(true)}
                        >
                            <LinearGradient
                                colors={['#242424', '#121212']}
                                style={styles.promoGradient}
                            >
                                <View style={styles.promoIconWrap}>
                                    <Ionicons name="at-circle" size={32} color="#00FF88" />
                                </View>
                                <View style={styles.promoTextWrap}>
                                    <Text style={styles.promoTitle}>Claim your @handle</Text>
                                    <Text style={styles.promoSub}>Personalize your Spark link</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#444" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {/* Verification / Needs Reverify */}
                    {profile?.needsReverify ? (
                        <TouchableOpacity 
                            style={[styles.glassCard, { backgroundColor: '#FF336610', borderColor: '#FF336630', borderWidth: 1 }]}
                            onPress={() => navigation.navigate('PhotoVerification')}
                        >
                            <View style={styles.alertRow}>
                                <Ionicons name="alert-circle" size={24} color="#FF3366" />
                                <View style={styles.alertTextWrap}>
                                    <Text style={[styles.alertTitle, { color: '#FF3366' }]}>Verification Required</Text>
                                    <Text style={[styles.alertSub, { color: colors.textSecondary }]}>Tap to re-verify your profile badge</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : !profile?.isVerified && (
                        <TouchableOpacity 
                            style={styles.verifyBanner}
                            onPress={() => navigation.navigate('PhotoVerification')}
                        >
                            <LinearGradient
                                colors={['#FF3366', '#FF1493']}
                                style={styles.verifyGradient}
                            >
                                <Ionicons name="shield-checkmark" size={22} color="white" />
                                <Text style={styles.verifyText}>Get Verified & Boost Matches</Text>
                                <Ionicons name="arrow-forward" size={18} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {/* Premium Upgrade */}
                    <TouchableOpacity 
                        style={styles.premiumCard}
                        onPress={() => navigation.navigate('Subscription')}
                    >
                        <LinearGradient
                            colors={['#1a1a1a', '#000000']}
                            style={styles.premiumGradient}
                        >
                            <View style={styles.premiumInfo}>
                                <Text style={styles.premiumHeading}>SPARK PREMIUM</Text>
                                <Text style={styles.premiumSubHeading}>Unlock the full experience</Text>
                            </View>
                            <View style={styles.premiumIconBox}>
                                <Ionicons name="diamond" size={28} color={COLORS.primary} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Legal / Secondary */}
                <View style={styles.footerSection}>
                    <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('SafetyCenter')}>
                        <Ionicons name="shield-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>Safety Center</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="options-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>Account Settings</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <UsernameModal
                visible={usernameVisible}
                onClose={() => setUsernameVisible(false)}
                uid={user?.uid}
                currentUsername={profile?.username}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerLogo: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 2,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: { paddingBottom: LAYOUT.TAB_BAR_HEIGHT + 40 },
    heroSection: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatarBorder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 4,
        borderColor: '#000',
    },
    editBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: COLORS.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000',
    },
    infoBox: {
        alignItems: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    nameText: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    statusText: {
        fontSize: 15,
        fontWeight: '500',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 25,
        marginBottom: 30,
    },
    statItem: {
        alignItems: 'center',
        gap: 10,
    },
    statIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    bannerContainer: {
        paddingHorizontal: 20,
        gap: 15,
    },
    glassCard: {
        padding: 16,
        borderRadius: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    cardValue: {
        fontSize: 15,
        fontWeight: '900',
    },
    progressBarBase: {
        height: 8,
        borderRadius: 4,
        marginBottom: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    cardHint: {
        fontSize: 12,
        fontWeight: '500',
    },
    promoBanner: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    promoGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    promoIconWrap: {
        marginRight: 15,
    },
    promoTextWrap: {
        flex: 1,
    },
    promoTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    promoSub: {
        color: '#888',
        fontSize: 13,
        marginTop: 2,
    },
    verifyBanner: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    verifyGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 12,
    },
    verifyText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    alertTextWrap: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    alertSub: {
        fontSize: 13,
        marginTop: 2,
    },
    premiumCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginTop: 10,
    },
    premiumGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
    },
    premiumHeading: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    premiumSubHeading: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '700',
        marginTop: 4,
    },
    premiumIconBox: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 30,
        marginTop: 40,
        paddingBottom: 20,
    },
    footerLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    footerLinkText: {
        fontSize: 13,
        fontWeight: '600',
    }
});

export default ProfileScreen;