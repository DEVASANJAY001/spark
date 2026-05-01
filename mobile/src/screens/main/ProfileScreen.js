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
import BoostModal from '../../components/BoostModal';
import { swipeService } from '../../services/swipeService';
import { subscriptionService } from '../../services/subscriptionService';
import AdBanner from '../../components/AdBanner';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const { user, profile } = useAuth();
    const { colors } = useTheme();
    const [availablePlans, setAvailablePlans] = useState([]);
    const [usernameVisible, setUsernameVisible] = useState(false);
    const [boostVisible, setBoostVisible] = useState(false);
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
        if (user && profile?.premiumTier) {
            loadSubscription();
        } else {
            setSubscription(null);
        }
        fetchAvailablePlans();
    }, [user, profile?.premiumTier]);

    const loadSubscription = async () => {
        const sub = await subscriptionService.getUserSubscription(user.uid, profile.premiumTier);
        setSubscription(sub);
    };

    const fetchAvailablePlans = async () => {
        try {
            const { collection, getDocs, query, orderBy } = require('firebase/firestore');
            const { db } = require('../../firebase/config');
            const q = query(collection(db, 'plans'));
            const snap = await getDocs(q);
            const plans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Explicit Sort Order: Silver, Gold, Platinum
            const order = { 'silver': 1, 'gold': 2, 'platinum': 3 };
            plans.sort((a, b) => (order[a.id.toLowerCase()] || 99) - (order[b.id.toLowerCase()] || 99));
            
            setAvailablePlans(plans);
        } catch (e) {
            console.error('Error fetching plans:', e);
        }
    };

    const calculateAge = (p) => {
        if (p?.age) return p.age;
        if (!p?.birthday) return '21';
        
        const birthday = p.birthday;
        let birthDate;
        if (typeof birthday === 'string') {
            if (birthday.includes('/')) {
                const [d, m, y] = birthday.split('/');
                birthDate = new Date(y, m - 1, d);
            } else {
                birthDate = new Date(birthday);
            }
        } else if (birthday.seconds) {
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

    const handleActivateBoost = async () => {
        if (!user) return;
        
        // One-time check for account
        if (profile?.boostsUsed >= 1) {
            Alert.alert('Boost Used', 'The profile boost is a one-time feature per account and has already been activated.');
            return;
        }

        // Tier Gating Check
        if (!userService.canUseFeature(profile, '1_boost_month')) {
            Alert.alert('Gold Feature', 'Upgrade to Gold or Platinum to activate your one-time profile boost and get 10x more visibility!', [
                { text: 'Later' },
                { text: 'Upgrade', onPress: () => navigation.navigate('Subscriptions') }
            ]);
            return;
        }

        try {
            await swipeService.activateBoost(user.uid);
            setBoostVisible(true);
        } catch (error) {
            Alert.alert('Boost Error', error.message || 'Could not activate boost. Please try again.');
        }
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
                                {profile?.firstName || 'User'}{(!profile?.firstName?.includes(profileAge?.toString()) && profileAge) ? `, ${profileAge}` : ''}
                            </Text>
                            {profile?.isVerified && (
                                <View style={styles.verifiedIconWrap}>
                                    <Ionicons name="checkmark-circle" size={22} color="#FF3366" />
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

                    <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Likes')}>
                        <LinearGradient colors={['#00D1FF', '#007AFF']} style={styles.statIconWrap}>
                            <View style={styles.badgeCount}>
                                <Text style={styles.badgeText}>{profile?.superLikes || 0}</Text>
                            </View>
                            <Ionicons name="star" size={22} color="white" />
                        </LinearGradient>
                        <Text style={[styles.statLabel, { color: colors.text }]}>Super Likes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statItem} onPress={handleActivateBoost}>
                        <LinearGradient 
                            colors={profile?.boostsUsed >= 1 ? ['#555', '#333'] : ['#4facfe', '#00f2fe']} 
                            style={styles.statIconWrap}
                        >
                            {profile?.boostsUsed >= 1 && (
                                <View style={styles.lockBadge}>
                                    <Ionicons name="lock-closed" size={10} color="white" />
                                </View>
                            )}
                            <Ionicons name="flash" size={22} color="white" />
                        </LinearGradient>
                        <Text style={[styles.statLabel, { color: colors.text }]}>Boosts</Text>
                    </TouchableOpacity>
                </View>

                {/* Dynamic Content Banners */}
                <View style={styles.bannerContainer}>
                    
                    {/* Completion Tracker */}
                    <TouchableOpacity 
                        style={[styles.glassCard, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Profile Strength</Text>
                            <Text style={[styles.cardValue, { color: '#FF3366' }]}>{userService.calculateCompletion(profile)}%</Text>
                        </View>
                        <View style={[styles.progressBarBase, { backgroundColor: colors.border }]}>
                            <LinearGradient 
                                colors={[COLORS.primary, '#FF1493']} 
                                start={{x:0, y:0}} end={{x:1, y:0}}
                                style={[styles.progressBarFill, { width: `${userService.calculateCompletion(profile)}%` }]} 
                            />
                        </View>
                        <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                            {userService.calculateCompletion(profile) < 100 
                                ? "Complete your profile to get 3x more matches!"
                                : "Excellent! Your profile is fully optimized for matches."}
                        </Text>
                    </TouchableOpacity>

                    {/* Subscription Section */}
                    <View style={styles.planSection}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Membership Status</Text>
                                {profile?.hasPremium && profile?.premiumTier ? (
                                    <Text style={[styles.expiryText, { color: COLORS.primary }]}>
                                        {profile.premiumTier.toUpperCase()} • Expires {profile.premiumExpiry ? new Date(profile.premiumExpiry).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Next Month'}
                                    </Text>
                                ) : (
                                    <Text style={[styles.expiryText, { color: colors.textSecondary }]}>Free Account • Limited Features</Text>
                                )}
                            </View>
                            {profile?.hasPremium && (
                                <View style={styles.activePlanBadge}>
                                    <Ionicons name="shield-checkmark" size={12} color="#FFF" />
                                    <Text style={styles.activePlanText}>ACTIVE</Text>
                                </View>
                            )}
                        </View>

                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.plansContainer}
                            snapToInterval={width * 0.8 + 15}
                            decelerationRate="fast"
                        >
                            {availablePlans.map((plan) => {
                                const idLower = plan.id.toLowerCase();
                                const isActive = profile?.premiumTier?.toLowerCase() === idLower;
                                const planColors = idLower === 'silver' ? ['#C0C0C0', '#8E8E93'] :
                                                  idLower === 'gold' ? ['#FFD700', '#FF9500'] :
                                                  idLower === 'platinum' ? ['#E5E4E2', '#AF52DE'] : [COLORS.primary, '#FF3366'];

                                return (
                                    <TouchableOpacity 
                                        key={plan.id}
                                        style={[
                                            styles.planCardHorizontal, 
                                            { backgroundColor: colors.surface },
                                            isActive && { borderColor: planColors[0], borderWidth: 2 }
                                        ]}
                                        onPress={() => navigation.navigate('Subscriptions')}
                                    >
                                        <LinearGradient
                                            colors={planColors}
                                            style={styles.planCardGradient}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                        >
                                            {isActive && (
                                                <View style={styles.cardActiveBadge}>
                                                    <Text style={styles.cardActiveText}>ACTIVE</Text>
                                                </View>
                                            )}
                                            
                                            <View style={styles.planCardHeader}>
                                                <View>
                                                    <Text style={styles.planTitle}>{plan.name.toUpperCase()}</Text>
                                                    <View style={styles.planPriceRow}>
                                                        <Text style={styles.planPriceLarge}>₹{plan.price}</Text>
                                                        <Text style={styles.planPeriodSmall}>/ {plan.period}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.planIconCircle}>
                                                    <Ionicons 
                                                        name={idLower === 'platinum' ? 'diamond' : (idLower === 'gold' ? 'key' : 'star')} 
                                                        size={22} 
                                                        color="#FFF" 
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.planHighlights}>
                                                {plan.features?.slice(0, 3).map((f, i) => (
                                                    <View key={i} style={styles.highlightItem}>
                                                        <Ionicons name="checkmark-circle" size={12} color="#FFF" />
                                                        <Text style={styles.highlightText} numberOfLines={1}>
                                                            {f.replace('_', ' ').substring(0, 15)}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
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

                    {/* Verification */}
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
                    ) : profile?.isVerified ? (
                        <View style={styles.verifyBanner}>
                            <LinearGradient
                                colors={['#00C853', '#00E676']}
                                style={styles.verifyGradient}
                            >
                                <Ionicons name="checkmark-circle" size={22} color="white" />
                                <Text style={styles.verifyText}>Profile Verified</Text>
                                <Ionicons name="checkmark-circle" size={18} color="white" />
                            </LinearGradient>
                        </View>
                    ) : !profile?.verificationPending && (
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
                    
                    <AdBanner placement="profile_bottom" style={{ marginTop: 20 }} />
                </View>

                {/* Footer */}
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

            <BoostModal 
                visible={boostVisible}
                onClose={() => setBoostVisible(false)}
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
    planSection: { marginTop: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
    sectionTitle: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    expiryText: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    activePlanBadge: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    activePlanText: { color: 'white', fontSize: 11, fontWeight: '900' },
    freeTag: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    plansContainer: { paddingHorizontal: 0, gap: 15, paddingBottom: 10 },
    planCardHorizontal: {
        width: width * 0.82,
        borderRadius: 32,
        overflow: 'hidden',
        height: 180,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    planCardGradient: { flex: 1, padding: 24, justifyContent: 'space-between', position: 'relative' },
    cardActiveBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cardActiveText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    planCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    planIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    planTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 1, marginBottom: 5 },
    planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
    planPriceLarge: { fontSize: 32, fontWeight: '900', color: '#FFF' },
    planPeriodSmall: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    planHighlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    highlightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    highlightText: { fontSize: 10, fontWeight: '900', color: '#FFF', textTransform: 'uppercase' },
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
    },
    badgeCount: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF3366',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
        zIndex: 10,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
        paddingHorizontal: 4,
    },
    lockBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#555',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
        zIndex: 10,
    }
});

export default ProfileScreen;