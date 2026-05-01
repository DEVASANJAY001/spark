import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, StatusBar, Platform, TextInput, Alert, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { couponService } from '../../services/couponService';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/userService';

const { width } = Dimensions.get('window');

const SubscriptionScreen = () => {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const { user, profile } = useAuth();
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'plans'));
                const fetchedPlans = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const idLower = doc.id.toLowerCase();
                    
                    // Assign colors if missing from DB
                    let colors = data.colors;
                    if (!colors || colors.length === 0) {
                        if (idLower === 'silver') colors = ['#C0C0C0', '#8E8E93'];
                        else if (idLower === 'gold') colors = ['#FFD700', '#FF9500'];
                        else if (idLower === 'platinum') colors = ['#E5E4E2', '#AF52DE'];
                        else colors = [COLORS.primary, '#FF3366'];
                    }

                    return {
                        id: doc.id,
                        ...data,
                        colors
                    };
                });

                // Explicit Sort Order: Silver, Gold, Platinum
                const order = { 'silver': 1, 'gold': 2, 'platinum': 3 };
                fetchedPlans.sort((a, b) => (order[a.id.toLowerCase()] || 99) - (order[b.id.toLowerCase()] || 99));

                setPlans(fetchedPlans);
                if (fetchedPlans.length > 0) {
                    // Default to Gold if available, otherwise second plan
                    const goldPlan = fetchedPlans.find(p => p.id.toLowerCase() === 'gold');
                    setSelectedPlan(goldPlan || fetchedPlans[1] || fetchedPlans[0]);
                }
            } catch (error) {
                console.error('Error fetching plans:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user?.uid]);

    const handleRedeem = async () => {
        if (!couponCode.trim()) return;
        setRedeeming(true);
        try {
            const result = await couponService.redeemCoupon(user.uid, couponCode);
            setSuccessMessage(result.message || 'Subscription activated!');
            setShowSuccessModal(true);
            setCouponCode('');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to redeem coupon');
        } finally {
            setRedeeming(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (plans.length === 0) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.errorText, { color: colors.text }]}>No subscription plans found.</Text>
                <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>Please initialize plans from the portal.</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: COLORS.primary }]} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isCurrentlyPremium = profile?.hasPremium && 
                              ['silver', 'gold', 'platinum'].includes(profile?.premiumTier?.toLowerCase());

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle="light-content" />
            
            {/* Minimalist Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Spark Premium</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <Text style={[styles.tagline, { color: colors.text }]}>Unlock Your Full Potential</Text>
                    <Text style={[styles.subTagline, { color: colors.textSecondary }]}>Choose a plan that fits your goals.</Text>
                </View>

                {/* Status Indicator */}
                {!isCurrentlyPremium && (
                    <View style={[styles.basicPlanCard, { backgroundColor: colors.surface }]}>
                        <Text style={styles.basicPlanLabel}>CURRENTLY ON BASIC</Text>
                        <View style={styles.basicFeatures}>
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={14} color="#00FF88" />
                                <Text style={[styles.featureSmallText, { color: colors.textSecondary }]}>Daily Swipes</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="close-circle" size={14} color="#FF3B30" />
                                <Text style={[styles.featureSmallText, { color: colors.textSecondary }]}>50 Daily Swipes Limit</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons name="close-circle" size={14} color="#FF3B30" />
                                <Text style={[styles.featureSmallText, { color: colors.textSecondary }]}>See Who Likes You</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Available Plans - Horizontal Scrollable Carousel */}
                <View style={styles.plansSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Experience</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.plansHorizontalScroll}
                        snapToInterval={width * 0.8 + 15}
                        decelerationRate="fast"
                    >
                        {plans.map((plan) => (
                            <TouchableOpacity
                                key={plan.id}
                                style={[
                                    styles.planCardHorizontal,
                                    { backgroundColor: colors.surface },
                                    selectedPlan?.id === plan.id && { borderColor: plan.colors?.[0] || COLORS.primary, borderWidth: 2 }
                                ]}
                                onPress={() => setSelectedPlan(plan)}
                                activeOpacity={0.9}
                            >
                                {plan.popular && (
                                    <LinearGradient
                                        colors={plan.colors || [COLORS.primary, '#FF3366']}
                                        style={styles.popularBadge}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.popularText}>BEST VALUE</Text>
                                    </LinearGradient>
                                )}
                                <View style={styles.planCardHeader}>
                                    <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                                    <View style={[styles.tierDot, { backgroundColor: plan.colors?.[0] || COLORS.primary }]} />
                                </View>
                                
                                <View style={styles.planPriceRow}>
                                    <Text style={[styles.planPriceLarge, { color: colors.text }]}>₹{plan.price}</Text>
                                    <Text style={[styles.planPeriodSmall, { color: colors.textSecondary }]}>/ {plan.period}</Text>
                                </View>

                                <View style={styles.planHighlights}>
                                    {plan.features.slice(0, 3).map((f, i) => (
                                        <View key={i} style={styles.highlightItem}>
                                            <Ionicons name="flash" size={12} color={plan.colors?.[0] || COLORS.primary} />
                                            <Text style={[styles.highlightText, { color: colors.textSecondary }]} numberOfLines={1}>
                                                {f.replace('_', ' ')}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Comparison Section */}
                {selectedPlan && (
                    <View style={[styles.comparisonCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.comparisonHeader}>
                            <Text style={[styles.comparisonTitle, { color: colors.text }]}>How it compares</Text>
                            <View style={styles.comparisonLabels}>
                                <Text style={[styles.comparisonLabelBasic, { color: colors.textSecondary }]}>BASIC</Text>
                                <Text style={[styles.comparisonLabelPremium, { color: selectedPlan.colors?.[0] || COLORS.primary }]}>
                                    {selectedPlan.name.split(' ')[1]?.toUpperCase() || selectedPlan.name.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.comparisonList}>
                            {/* Comparison Rows */}
                            {[
                                { name: 'Chat Capacity (Active Persons)', free: '3', premium: selectedPlan.id.toLowerCase() === 'platinum' ? 'Unlimited' : (selectedPlan.id.toLowerCase() === 'gold' ? '15' : '8') },
                                { name: 'Unlimited Messaging (Per Person)', free: true, premium: true },
                                { name: 'Daily Swipes', free: '50/day', premium: 'Unlimited' },
                                { name: 'See Who Likes You', free: false, premium: true },
                                { name: 'Super Likes', free: '0/day', premium: '5/day' },
                                { name: 'Profile Boost', free: false, premium: true },
                                { name: 'Ad-Free Experience', free: false, premium: true },
                                { name: 'Intro Message (Before Match)', free: false, premium: selectedPlan.id.toLowerCase() === 'platinum' },
                                { name: 'Travel Mode', free: false, premium: selectedPlan.id.toLowerCase() !== 'silver' },
                                { name: 'Priority Likes', free: false, premium: selectedPlan.id.toLowerCase() === 'platinum' },
                                { name: 'Advanced Filters', free: false, premium: selectedPlan.id.toLowerCase() === 'platinum' },
                            ].map((row, i) => (
                                <View key={i} style={[styles.comparisonRow, i % 2 === 0 && { backgroundColor: 'rgba(255,255,255,0.02)' }]}>
                                    <Text style={[styles.rowName, { color: colors.textSecondary }]}>{row.name}</Text>
                                    <View style={styles.rowValues}>
                                        <View style={styles.valueWrap}>
                                            {typeof row.free === 'string' ? (
                                                <Text style={[styles.valueText, { color: colors.text }]}>{row.free}</Text>
                                            ) : row.free ? (
                                                <Ionicons name="checkmark-circle" size={16} color="#00FF88" />
                                            ) : (
                                                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.1)" />
                                            )}
                                        </View>
                                        <View style={styles.valueWrap}>
                                            {typeof row.premium === 'string' ? (
                                                <Text style={[styles.valueText, { color: selectedPlan.colors?.[0] || COLORS.primary, fontWeight: '900' }]}>{row.premium}</Text>
                                            ) : row.premium ? (
                                                <Ionicons name="checkmark-circle" size={18} color={selectedPlan.colors?.[0] || COLORS.primary} />
                                            ) : (
                                                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.1)" />
                                            )}
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Sticky Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[styles.subscribeBtn, isCurrentlyPremium && { opacity: 0.6 }]}
                    onPress={() => {
                        if (isCurrentlyPremium) {
                            Alert.alert(
                                'Plan Active', 
                                `You are currently on the ${profile.premiumTier.toUpperCase()} plan. You can only change your plan once your current subscription expires.`,
                                [{ text: 'OK' }]
                            );
                            return;
                        }
                        navigation.navigate('Payment', { plan: selectedPlan });
                    }}
                    disabled={isCurrentlyPremium}
                >
                    <LinearGradient
                        colors={isCurrentlyPremium ? ['#222', '#333'] : (selectedPlan?.colors || [COLORS.primary, '#FF3366'])}
                        style={styles.subscribeGradient}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.btnContent}>
                            <Text style={styles.subscribeBtnText}>
                                {isCurrentlyPremium 
                                    ? `${profile.premiumTier.toUpperCase()} ACTIVE` 
                                    : `Get ${selectedPlan?.name} • ₹${selectedPlan?.price}`
                                }
                            </Text>
                            <Ionicons name={isCurrentlyPremium ? 'lock-closed' : 'arrow-forward'} size={20} color="white" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
                    {isCurrentlyPremium 
                        ? 'Current subscription is active and locked' 
                        : 'Instant access • Secure checkout'
                    }
                </Text>
            </View>

            {/* Premium Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={[styles.successCard, { backgroundColor: '#1a1a1a' }]}>
                        <View style={styles.successIconWrapper}>
                            <LinearGradient
                                colors={['#00FF88', '#00BD63']}
                                style={styles.successIconGradient}
                            >
                                <Ionicons name="checkmark" size={40} color="white" />
                            </LinearGradient>
                        </View>
                        
                        <Text style={styles.successTitle}>Subscription Activated!</Text>
                        <Text style={styles.successSub}>{successMessage}</Text>
                        
                        <TouchableOpacity 
                            style={styles.modalActionBtn}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.navigate('Main', { screen: 'Profile' });
                            }}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#FF3366']}
                                style={styles.modalActionGradient}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.modalActionText}>Let's Spark!</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 70,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    scrollContent: { paddingBottom: 160 },
    heroSection: { alignItems: 'center', paddingVertical: 25, paddingHorizontal: 40 },
    tagline: { fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 32 },
    subTagline: { fontSize: 16, fontWeight: '500', marginTop: 10, opacity: 0.8 },
    basicPlanCard: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    basicPlanLabel: { fontSize: 11, fontWeight: '900', color: '#888', letterSpacing: 1.5, marginBottom: 15 },
    basicFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    featureSmallText: { fontSize: 12, fontWeight: '600' },
    plansHorizontalScroll: {
        paddingLeft: 20,
        paddingRight: 50,
        paddingBottom: 10,
        gap: 15,
    },
    planCardHorizontal: {
        width: width * 0.8,
        borderRadius: 32,
        padding: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.06)',
        position: 'relative',
        height: 180,
        justifyContent: 'space-between',
    },
    planCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tierDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        opacity: 0.8,
    },
    planPriceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 5,
    },
    planPriceLarge: {
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: -1,
    },
    planPeriodSmall: {
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.6,
    },
    planHighlights: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    highlightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    highlightText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    plansSection: { marginTop: 30, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 15 },
    plansList: { gap: 15 },
    planCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    popularText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    planMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planName: { fontSize: 22, fontWeight: '900' },
    planPeriod: { fontSize: 14, fontWeight: '600', marginTop: 4 },
    priceColumn: { alignItems: 'flex-end' },
    planPrice: { fontSize: 24, fontWeight: '900' },
    perMonth: { fontSize: 12, fontWeight: '500' },
    comparisonCard: { margin: 20, padding: 20, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    comparisonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    comparisonTitle: { fontSize: 18, fontWeight: '900' },
    comparisonLabels: { flexDirection: 'row', gap: 15 },
    comparisonLabelBasic: { fontSize: 10, fontWeight: '900', color: '#888', width: 45, textAlign: 'center' },
    comparisonLabelPremium: { fontSize: 10, fontWeight: '900', width: 60, textAlign: 'center' },
    comparisonList: { gap: 0 },
    comparisonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12 },
    rowName: { fontSize: 14, fontWeight: '600', flex: 1 },
    rowValues: { flexDirection: 'row', gap: 15 },
    valueWrap: { width: 50, alignItems: 'center', justifyContent: 'center' },
    valueText: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
    moreBenefits: { marginTop: 25, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    moreTitle: { fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
    moreList: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
    couponCard: { marginHorizontal: 20, padding: 20, borderRadius: 24, marginBottom: 20 },
    couponTitle: { fontSize: 16, fontWeight: '800', marginBottom: 15 },
    couponInputRow: { flexDirection: 'row', gap: 10 },
    couponInput: {
        flex: 1,
        height: 52,
        borderRadius: 15,
        paddingHorizontal: 15,
        fontSize: 16,
        fontWeight: '700',
    },
    redeemBtn: { paddingHorizontal: 20, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    redeemText: { color: 'white', fontWeight: '800' },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopWidth: 1,
    },
    subscribeBtn: { borderRadius: 22, overflow: 'hidden', height: 64 },
    subscribeGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    subscribeBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
    footerNote: { textAlign: 'center', fontSize: 12, marginTop: 12, fontWeight: '500' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorText: { fontSize: 18, fontWeight: '800', marginTop: 20 },
    errorSubtext: { fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 30 },
    retryButton: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20 },
    retryText: { color: 'white', fontWeight: '800' },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successCard: {
        width: '100%',
        borderRadius: 35,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    successIconWrapper: {
        marginBottom: 20,
    },
    successIconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00FF88',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
    },
    successSub: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    modalActionBtn: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalActionGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalActionText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
    },
});

export default SubscriptionScreen;
