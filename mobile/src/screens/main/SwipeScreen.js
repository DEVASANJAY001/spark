import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    interpolate, 
    runOnJS
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import SwipeCard from '../../components/SwipeCard';
import MatchCelebrationModal from '../../components/MatchCelebrationModal';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, LAYOUT } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { swipeService } from '../../services/swipeService';
import DiscoveryFilterModal from '../../components/DiscoveryFilterModal';
import BoostModal from '../../components/BoostModal';
import { adService } from '../../services/adService';
import { subscriptionService } from '../../services/subscriptionService';
import SwipeAdCard from '../../components/SwipeAdCard';
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatService';

const { width, height } = Dimensions.get('window');

const SWIPE_THRESHOLD = width * 0.25;
const CARD_WIDTH = width * 0.94;
const CARD_HEIGHT = height * 0.73;

// ─── Swipe Card Wrapper (Individual Card Logic) ───────────────────────────────
const AnimatedSwipeCard = ({ 
    item, 
    isTop, 
    onSwipeLeft, 
    onSwipeRight, 
    onSwipeTop, 
    currentUserLocation
}) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // Reset position if card was previously swiped and now is back (rewind)
    useEffect(() => {
        if (isTop) {
            translateX.value = 0;
            translateY.value = 0;
        }
    }, [isTop]);

    const gesture = Gesture.Pan()
        .enabled(isTop)
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (event.translationX > SWIPE_THRESHOLD) {
                translateX.value = withTiming(width * 1.5, { duration: 300 }, () => {
                    runOnJS(onSwipeRight)();
                });
            } else if (event.translationX < -SWIPE_THRESHOLD) {
                translateX.value = withTiming(-width * 1.5, { duration: 300 }, () => {
                    runOnJS(onSwipeLeft)();
                });
            } else if (event.translationY < -SWIPE_THRESHOLD) {
                translateY.value = withTiming(-height * 1.5, { duration: 300 }, () => {
                    runOnJS(onSwipeTop)();
                });
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-width / 2, 0, width / 2],
            [-10, 0, 10]
        );

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` },
                { scale: isTop ? 1 : interpolate(Math.abs(translateX.value), [0, 100], [0.95, 1], 'clamp') }
            ],
            opacity: isTop ? 1 : interpolate(Math.abs(translateX.value), [0, 100], [0.8, 1], 'clamp')
        };
    });

    const likeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [20, 100], [0, 1], 'clamp'),
    }));

    const nopeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [-100, -20], [1, 0], 'clamp'),
    }));

    const superOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.value, [-150, -50], [1, 0], 'clamp'),
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.cardWrapper, { zIndex: isTop ? 20 : 10 }, animatedStyle]}>
                {!item.isAd && (
                    <>
                        <Animated.View style={[styles.overlayLabel, styles.likeLabel, likeOpacity]}>
                            <View style={[styles.overlayBox, { borderColor: '#00FF88' }]}>
                                <Text style={[styles.overlayText, { color: '#00FF88' }]}>LIKE</Text>
                            </View>
                        </Animated.View>

                        <Animated.View style={[styles.overlayLabel, styles.nopeLabel, nopeOpacity]}>
                            <View style={[styles.overlayBox, { borderColor: COLORS.primary }]}>
                                <Text style={[styles.overlayText, { color: COLORS.primary }]}>NOPE</Text>
                            </View>
                        </Animated.View>

                        <Animated.View style={[styles.overlayLabel, styles.superLabel, superOpacity]}>
                            <View style={[styles.overlayBox, { borderColor: '#00D1FF' }]}>
                                <Text style={[styles.overlayText, { color: '#00D1FF' }]}>SUPER</Text>
                            </View>
                        </Animated.View>
                    </>
                )}

                {item.isAd ? (
                    <SwipeAdCard ad={item} />
                ) : (
                    <SwipeCard
                        profile={item}
                        currentUserLocation={currentUserLocation}
                    />
                )}
            </Animated.View>
        </GestureDetector>
    );
};

const SwipeScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const { user, profile } = useAuth();

    const [cards, setCards]               = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading]           = useState(true);
    const [isFetching, setIsFetching]     = useState(false);
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [matchedUser, setMatchedUser]   = useState(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showBoost, setShowBoost]       = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [filters, setFilters]           = useState({
        maxDistance: 50,
        ageRange: [18, 50],
        interestedIn: profile?.interestedIn || 'Everyone',
        showFurtherAway: false,
        minPhotos: 1,
    });

    const cardsRef = useRef(cards);
    useEffect(() => { cardsRef.current = cards; }, [cards]);

    const handleAction = useCallback(async (index, type) => {
        const target = cardsRef.current[index];
        if (!target || !user) return;
        if (target.isAd) return;

        try {
            const result = await swipeService.handleSwipe(user.uid, target.id, type, subscription);
            if (result?.isMatch) {
                setMatchedUser(target);
                setShowMatchModal(true);
            }
        } catch (e) {
            if (e.message === 'LIMIT_REACHED') {
                Alert.alert('Out of Swipes', 'You have reached your daily limit. Upgrade to unlock unlimited swipes!', [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('Subscriptions') }
                ]);
            }
        }
    }, [subscription, navigation, user]);

    const handleSwipeLeft  = () => {
        handleAction(currentIndex, 'pass');
        setCurrentIndex(prev => prev + 1);
    };

    const handleSwipeRight = () => {
        handleAction(currentIndex, 'like');
        setCurrentIndex(prev => prev + 1);
    };

    const handleSwipeTop   = () => {
        handleAction(currentIndex, 'superlike');
        setCurrentIndex(prev => prev + 1);
    };

    const rewind = () => {
        if (currentIndex === 0) return;
        setCurrentIndex(prev => prev - 1);
    };

    useEffect(() => {
        if (user?.uid && profile) {
            loadSubscription();
            fetchCards();
        }
    }, [user?.uid, profile]);

    const loadSubscription = async () => {
        if (!user?.uid || !profile?.premiumTier) return;
        const sub = await subscriptionService.getUserSubscription(user.uid, profile.premiumTier);
        setSubscription(sub);
    };

    const fetchCards = async () => {
        if (!user || !profile || isFetching) return;
        setIsFetching(true);
        setLoading(cards.length === 0);
        
        try {
            const matches = await swipeService.getPotentialMatches(
                user.uid,
                filters.interestedIn || profile.interestedIn,
                profile.gender,
                { ...filters, userLocation: profile.location }
            );

            const swipeAds = await adService.getAdsByPlacement('swipe_deck', profile.location, null, subscription);
            
            let finalCards = [...matches];
            if (swipeAds.length > 0) {
                swipeAds.forEach((ad, i) => {
                    const insertPos = (i + 1) * 6;
                    if (insertPos < finalCards.length) finalCards.splice(insertPos, 0, { ...ad, isAd: true });
                });
            }
            setCards(finalCards);
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setIsFetching(false);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const hasCards = cards.length > 0 && currentIndex < cards.length;

    const renderStack = () => {
        if (!hasCards) {
            return (
                <View style={styles.center}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
                        <Ionicons name="sparkles" size={60} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up!</Text>
                    <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                        You've seen everyone for now. Check back later!
                    </Text>
                    <TouchableOpacity 
                        style={[styles.primaryActionBtn, { backgroundColor: COLORS.primary }]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Text style={styles.primaryActionText}>Adjust Filters</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // We only render 2 cards at a time for performance: Top and Next
        return cards.slice(currentIndex, currentIndex + 2).reverse().map((item, index, array) => {
            const isTop = index === array.length - 1;
            return (
                <AnimatedSwipeCard
                    key={item.id}
                    item={item}
                    isTop={isTop}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                    onSwipeTop={handleSwipeTop}
                    currentUserLocation={profile?.location}
                />
            );
        });
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={[styles.headerIconBtn, { backgroundColor: colors.surface }]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Ionicons name="options-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                    
                    <View style={styles.logoContainer}>
                        <Text style={[styles.headerLogo, { color: COLORS.primary }]}>SPARK</Text>
                        <View style={styles.logoDot} />
                    </View>

                    <TouchableOpacity
                        style={[styles.headerIconBtn, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.navigate('Chat', { screen: 'Matches' })}
                    >
                        <Ionicons name="chatbubbles-sharp" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.swiperContainer}>{renderStack()}</View>

                {hasCards && (
                    <View style={styles.footerDock}>
                        <TouchableOpacity
                            style={[styles.dockBtn, styles.dockBtnSmall, { backgroundColor: colors.surface }]}
                            onPress={() => {
                                if (userService.canUseFeature(profile, 'unlimited_rewind')) {
                                    rewind();
                                } else {
                                    Alert.alert('Premium', 'Upgrade to Gold to rewind swipes!', [
                                        { text: 'Later' },
                                        { text: 'Upgrade', onPress: () => navigation.navigate('Subscriptions') }
                                    ]);
                                }
                            }}
                        >
                            <Ionicons name="refresh" size={20} color="#FFD700" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.dockBtn, styles.dockBtnLarge, { backgroundColor: colors.surface }]}
                            onPress={handleSwipeLeft}
                        >
                            <Ionicons name="close" size={36} color={COLORS.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.dockBtn, styles.dockBtnLarge, { backgroundColor: colors.surface }]}
                            onPress={handleSwipeRight}
                        >
                            <Ionicons name="heart" size={36} color="#00FF88" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.dockBtn, styles.dockBtnSmall, { backgroundColor: colors.surface }]}
                            onPress={() => setShowBoost(true)}
                        >
                            <Ionicons name="flash" size={20} color="#9C27B0" />
                        </TouchableOpacity>
                    </View>
                )}

                <MatchCelebrationModal
                    visible={showMatchModal}
                    onClose={() => setShowMatchModal(false)}
                    matchedUser={matchedUser}
                    currentUser={profile}
                    onSendMessage={async () => {
                        // Check chat limit before navigating
                        const canStart = await chatService.canStartNewChat(user.uid, profile?.premiumTier);
                        
                        if (!canStart) {
                            setShowMatchModal(false);
                            const limit = userService.getChatLimit(profile?.premiumTier);
                            Alert.alert(
                                'Chat Capacity Full',
                                `Your current plan allows for ${limit} active conversations. Upgrade to unlock more capacity and start chatting with ${matchedUser?.firstName}!`,
                                [
                                    { text: 'Later', style: 'cancel' },
                                    { text: 'Upgrade', onPress: () => navigation.navigate('Subscriptions') }
                                ]
                            );
                            return;
                        }

                        setShowMatchModal(false);
                        const matchId = [user.uid, matchedUser.id].sort().join('_');
                        navigation.navigate('Chat', {
                            screen: 'ChatDetail',
                            params: { matchId, otherUser: matchedUser },
                        });
                    }}
                />
                <DiscoveryFilterModal
                    visible={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    initialFilters={filters}
                    onApply={(newFilters) => {
                        setFilters(newFilters);
                        fetchCards();
                    }}
                />
                <BoostModal visible={showBoost} onClose={() => setShowBoost(false)} />
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container:  { flex: 1 },
    center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 70,
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: { flexDirection: 'row', alignItems: 'flex-end' },
    headerLogo: { fontSize: 24, fontWeight: '900', letterSpacing: 3 },
    logoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 6, marginLeft: 2 },
    swiperContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cardWrapper: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        backgroundColor: '#000',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 16 },
            android: { elevation: 12 }
        })
    },
    overlayLabel: { position: 'absolute', zIndex: 99 },
    likeLabel:  { top: 50, left: 30,  transform: [{ rotate: '-20deg' }] },
    nopeLabel:  { top: 50, right: 30, transform: [{ rotate: '20deg'  }] },
    superLabel: { bottom: 120, alignSelf: 'center' },
    overlayBox: { borderWidth: 4, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.1)' },
    overlayText: { fontSize: 40, fontWeight: '900', letterSpacing: 2 },
    footerDock: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: LAYOUT.TAB_BAR_HEIGHT + 20, gap: 15, zIndex: 100 },
    dockBtn: { borderRadius: 35, justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 }, android: { elevation: 6 } }) },
    dockBtnSmall: { width: 44, height: 44, opacity: 0.9 },
    dockBtnLarge: { width: 70, height: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    emptyIconContainer: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    emptyTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12 },
    emptySub:   { fontSize: 15, textAlign: 'center', opacity: 0.6, lineHeight: 22, marginBottom: 35 },
    primaryActionBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20 },
    primaryActionText: { color: 'white', fontWeight: '800', fontSize: 16 }
});

export default SwipeScreen;