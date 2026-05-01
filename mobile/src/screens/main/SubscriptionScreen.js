import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, SafeAreaView, ActivityIndicator, StatusBar, Platform, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { couponService } from '../../services/couponService';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const SubscriptionScreen = () => {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'plans'));
                const fetchedPlans = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                fetchedPlans.sort((a, b) => (a.price || 0) - (b.price || 0));
                setPlans(fetchedPlans);
                if (fetchedPlans.length > 0) {
                    setSelectedPlan(fetchedPlans[1] || fetchedPlans[0]);
                }
            } catch (error) {
                console.error('Error fetching plans:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleRedeem = async () => {
        if (!couponCode.trim()) return;
        setRedeeming(true);
        try {
            const result = await couponService.redeemCoupon(user.uid, couponCode);
            Alert.alert('Success', result.message);
            setCouponCode('');
            navigation.goBack();
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

                {/* Free Plan (Legacy/Basic Info) */}
                <View style={[styles.basicPlanCard, { backgroundColor: colors.surface }]}>
                    <Text style={styles.basicPlanLabel}>CURRENTLY ON BASIC</Text>
                    <View style={styles.basicFeatures}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={14} color="#00FF88" />
                            <Text style={[styles.featureSmallText, { color: colors.textSecondary }]}>Daily Swipes</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="close-circle" size={14} color="#FF3B30" />
                            <Text style={[styles.featureSmallText, { color: colors.textSecondary }]}>Unlimited Swipes</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="close-circle" size={14} color="#FF3B30" />
                            <Text style={[styles.featureSmallText, { color: colors.textSecondary }]}>See Who Likes You</Text>
                        </View>
                    </View>
                </View>

                {/* Available Plans */}
                <View style={styles.plansSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Select a Plan</Text>
                    <View style={styles.plansList}>
                        {plans.map((plan) => (
                            <TouchableOpacity
                                key={plan.id}
                                style={[
                                    styles.planCard,
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
                                <View style={styles.planMain}>
                                    <View>
                                        <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                                        <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>{plan.period}</Text>
                                    </View>
                                    <View style={styles.priceColumn}>
                                        <Text style={[styles.planPrice, { color: colors.text }]}>₹{plan.price}</Text>
                                        <Text style={[styles.perMonth, { color: colors.textSecondary }]}>one-time</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Full Benefits Breakdown */}
                {selectedPlan && (
                    <View style={[styles.benefitsCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.benefitsTitle, { color: colors.text }]}>{selectedPlan.name} Benefits</Text>
                        <View style={styles.benefitItems}>
                            {selectedPlan.features.map((feature, i) => (
                                <View key={i} style={styles.benefitRow}>
                                    <View style={[styles.checkCircle, { backgroundColor: (selectedPlan.colors?.[0] || COLORS.primary) + '20' }]}>
                                        <Ionicons name="checkmark-sharp" size={14} color={selectedPlan.colors?.[0] || COLORS.primary} />
                                    </View>
                                    <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Coupon Section */}
                <View style={[styles.couponCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.couponTitle, { color: colors.text }]}>Have a Coupon?</Text>
                    <View style={styles.couponInputRow}>
                        <TextInput
                            style={[styles.couponInput, { backgroundColor: colors.background, color: colors.text }]}
                            placeholder="Enter Code"
                            placeholderTextColor={colors.textSecondary}
                            value={couponCode}
                            onChangeText={setCouponCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity 
                            style={[styles.redeemBtn, { backgroundColor: COLORS.primary }]}
                            onPress={handleRedeem}
                            disabled={redeeming || !couponCode}
                        >
                            {redeeming ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.redeemText}>Apply</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Sticky Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={styles.subscribeBtn}
                    onPress={() => navigation.navigate('Payment', { plan: selectedPlan })}
                >
                    <LinearGradient
                        colors={selectedPlan?.colors || [COLORS.primary, '#FF3366']}
                        style={styles.subscribeGradient}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.subscribeBtnText}>Upgrade to {selectedPlan?.name}</Text>
                        <Ionicons name="arrow-forward-sharp" size={20} color="white" />
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={[styles.footerNote, { color: colors.textSecondary }]}>Secure payment • Cancel anytime</Text>
            </View>
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
    benefitsCard: { margin: 20, padding: 25, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    benefitsTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20 },
    benefitItems: { gap: 15 },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkCircle: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    benefitText: { fontSize: 15, fontWeight: '500' },
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
    retryText: { color: 'white', fontWeight: '800' }
});

export default SubscriptionScreen;

