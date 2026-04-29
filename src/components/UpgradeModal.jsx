import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
    FlatList,
    Platform,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import useAuth from '../hooks/useAuth';

const { width } = Dimensions.get('window');

const TIER_CONFIG = {
    plus: {
        title: 'tinder',
        badge: '+',
        badgeColor: '#ff006e',
        headline: 'Unlimited Likes. Unlimited Rewinds. Unlimited Passport™ Mode. No Ads.',
        gradient: ['#1a0008', '#3d0015'],
        accent: '#ff006e',
        features: [
            { title: 'Unlimited Likes', icon: 'heart' },
            { title: 'Unlimited Rewinds', icon: 'refresh' },
            { title: 'Unlimited Passport™ Mode', subtitle: 'Match and chat with people anywhere in the world.', icon: 'navigate' },
            { title: 'Control Your Profile', subtitle: 'Only show what you want them to know.', icon: 'settings' },
            { title: 'Hide Ads', icon: 'eye-off' }
        ],
        prices: { '1week': 99, '1month': 199, '6months': 699 }
    },
    gold: {
        title: 'tinder',
        badge: 'GOLD',
        badgeColor: '#D4AF37',
        headline: 'See Who Likes You and match with them instantly with Tinder Gold™.',
        gradient: ['#1a1200', '#2d1f00'],
        accent: '#D4AF37',
        features: [
            { title: 'Unlimited Likes', icon: 'heart' },
            { title: 'See Who Likes You', subtitle: 'Match instantly with people who already liked you.', icon: 'star' },
            { title: '1 Free Boost per month', subtitle: 'Available for 1 month or longer subs.', icon: 'flash' },
            { title: '2 Free Super Likes per week', icon: 'star-outline' },
            { title: 'Top Picks', subtitle: 'Daily curated selection of profiles.', icon: 'diamond' },
            { title: 'Unlimited Passport™ Mode', icon: 'navigate' }
        ],
        prices: { '1week': 159, '1month': 319, '6months': 999 }
    },
    platinum: {
        title: 'tinder',
        badge: 'PLATINUM',
        badgeColor: '#E5E4E2',
        headline: 'Upgrade your Likes and Super Likes with Tinder Platinum.',
        gradient: ['#000000', '#2c3e50'],
        accent: '#C0C0C0',
        features: [
            { title: 'Unlimited Likes', icon: 'heart' },
            { title: 'See Who Likes You', icon: 'star' },
            { title: 'Priority Likes', subtitle: 'Your Likes will be seen sooner.', icon: 'trending-up' },
            { title: '3 Free Super Likes per week', icon: 'star-outline' },
            { title: '3 Free First Impressions per week', subtitle: 'Message before matching.', icon: 'chatbubble-ellipses' },
            { title: '1 Free Boost per month', icon: 'flash' }
        ],
        prices: { '1week': 385, '1month': 769, '6months': 1999 }
    }
};

const PLANS = [
    { id: '1week', label: '1 Week', subLabel: 'Popular' },
    { id: '1month', label: '1 Month', subLabel: 'Best Value' },
    { id: '6months', label: '6 Months', subLabel: 'Save Long Term' }
];

const UpgradeModal = ({ visible, onClose, tier = 'gold' }) => {
    const { updateProfile } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState('1week');
    const [activeIndex, setActiveIndex] = useState(0);
    const config = TIER_CONFIG[tier] || TIER_CONFIG.gold;

    const handlePurchase = async () => {
        try {
            await updateProfile({
                hasPremium: true,
                premiumTier: tier,
                premiumPlan: selectedPlan,
                superLikes: tier === 'platinum' ? 3 : (tier === 'gold' ? 2 : 0),
                boosts: 1
            });
            Alert.alert("Success", `Welcome to Spark ${tier.toUpperCase()}!`);
            onClose();
        } catch (error) {
            Alert.alert("Error", "Payment failed. Please try again.");
        }
    };

    const renderPlanCard = ({ item, index }) => {
        const isSelected = selectedPlan === item.id;
        const price = config.prices[item.id];
        const perWeek = item.id === '1month' ? (price / 4).toFixed(2) : (item.id === '6months' ? (price / 24).toFixed(2) : price);

        return (
            <TouchableOpacity
                style={[
                    styles.planCard,
                    isSelected && { borderColor: config.accent, borderWidth: 2 }
                ]}
                onPress={() => setSelectedPlan(item.id)}
            >
                {item.subLabel && (
                    <View style={[styles.popularBadge, { backgroundColor: config.accent }]}>
                        <Text style={styles.popularText}>{item.subLabel}</Text>
                    </View>
                )}
                <Text style={styles.planDuration}>{item.label}</Text>
                <Text style={styles.planPrice}>₹{perWeek}/wk</Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <LinearGradient colors={config.gradient} style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>
                        <View style={styles.logoRow}>
                            <Text style={styles.logoText}>{config.title}</Text>
                            <View style={[styles.tierBadge, { backgroundColor: config.badgeColor }]}>
                                <Text style={styles.tierBadgeText}>{config.badge}</Text>
                            </View>
                        </View>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Hero */}
                        <View style={styles.hero}>
                            <Text style={styles.headline}>{config.headline}</Text>
                        </View>

                        {/* Plan Selector */}
                        <View style={styles.selectorSection}>
                            <Text style={styles.likesLabel}>Likes</Text>
                            <FlatList
                                data={PLANS}
                                renderItem={renderPlanCard}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled
                                snapToAlignment="center"
                                decelerationRate="fast"
                                contentContainerStyle={styles.planList}
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
                                    setActiveIndex(index);
                                    setSelectedPlan(PLANS[index].id);
                                }}
                            />
                            <View style={styles.dotContainer}>
                                {PLANS.map((_, i) => (
                                    <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
                                ))}
                            </View>
                        </View>

                        {/* Features */}
                        <View style={styles.featuresSection}>
                            <View style={styles.featureHeader}>
                                <View style={styles.line} />
                                <Text style={styles.featureHeaderText}>Included with Tinder {tier.charAt(0).toUpperCase() + tier.slice(1)}®</Text>
                                <View style={styles.line} />
                            </View>

                            {config.features.map((f, i) => (
                                <View key={i} style={styles.featureRow}>
                                    <Ionicons name="checkmark-circle" size={24} color={config.accent} />
                                    <View style={styles.featureInfo}>
                                        <Text style={styles.featureTitle}>{f.title}</Text>
                                        {f.subtitle && <Text style={styles.featureSubtitle}>{f.subtitle}</Text>}
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Legal */}
                        <View style={styles.legalSection}>
                            <Text style={styles.legalText}>
                                By tapping Continue, you will be charged, your subscription will auto-renew for the same price and package length until you cancel via Play Store settings, and you agree to our Terms.
                            </Text>
                        </View>

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Footer CTA */}
                    <View style={styles.footer}>
                        <LinearGradient
                            colors={tier === 'platinum' ? ['#333', '#111'] : (tier === 'gold' ? ['#D4AF37', '#B8860B'] : ['#ff006e', '#ff4d94'])}
                            style={styles.ctaGradient}
                        >
                            <TouchableOpacity style={styles.ctaBtn} onPress={handlePurchase}>
                                <Text style={styles.ctaText}>
                                    Continue for ₹{config.prices[selectedPlan]} total
                                </Text>
                            </TouchableOpacity>
                        </LinearGradient>
                        <TouchableOpacity style={styles.restoreBtn}>
                            <Text style={styles.restoreText}>Restore Purchases</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 60,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoText: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -1,
    },
    tierBadge: {
        marginLeft: 5,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tierBadgeText: {
        color: 'black',
        fontSize: 10,
        fontWeight: 'bold',
    },
    hero: {
        paddingHorizontal: 30,
        paddingVertical: 20,
        alignItems: 'center',
    },
    headline: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 28,
    },
    selectorSection: {
        paddingVertical: 20,
    },
    selectorLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    planList: {
        paddingHorizontal: 20,
    },
    planCard: {
        width: width - 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    planDuration: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    planPrice: {
        color: 'white',
        fontSize: 16,
        marginTop: 10,
        opacity: 0.8,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    popularText: {
        color: 'black',
        fontSize: 10,
        fontWeight: 'bold',
    },
    dotContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#666',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: 'white',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    featuresSection: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        marginHorizontal: 20,
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    featureHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    featureHeaderText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginHorizontal: 10,
        textTransform: 'uppercase',
        opacity: 0.6,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 18,
    },
    featureInfo: {
        marginLeft: 15,
        flex: 1,
    },
    featureTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    featureSubtitle: {
        color: 'white',
        fontSize: 13,
        opacity: 0.6,
        marginTop: 2,
    },
    legalSection: {
        padding: 30,
    },
    legalText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 20,
        backgroundColor: 'transparent',
    },
    ctaGradient: {
        borderRadius: 30,
    },
    ctaBtn: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    restoreBtn: {
        marginTop: 15,
        alignItems: 'center',
    },
    restoreText: {
        color: '#999',
        fontSize: 12,
        fontWeight: 'bold',
    }
});

export default UpgradeModal;
