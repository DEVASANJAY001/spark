import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Animated,
    PanResponder,
    Platform
} from 'react-native';
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

const { width, height } = Dimensions.get('window');

const SWIPE_THRESHOLD = width * 0.25;
const CARD_WIDTH = width * 0.94;
const CARD_HEIGHT = height * 0.68;

// ─── Professional Swiper Hook ─────────────────────────────────────────────────
function useSwiper({ onSwipeLeft, onSwipeRight, onSwipeTop }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const position = useRef(new Animated.ValueXY()).current;
    const isAnimating = useRef(false);

    const onSwipeLeftRef  = useRef(onSwipeLeft);
    const onSwipeRightRef = useRef(onSwipeRight);
    const onSwipeTopRef   = useRef(onSwipeTop);
    useEffect(() => { onSwipeLeftRef.current  = onSwipeLeft;  }, [onSwipeLeft]);
    useEffect(() => { onSwipeRightRef.current = onSwipeRight; }, [onSwipeRight]);
    useEffect(() => { onSwipeTopRef.current   = onSwipeTop;   }, [onSwipeTop]);

    const currentIndexRef = useRef(0);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    const forceSwipe = useCallback((direction) => {
        if (isAnimating.current) return;
        isAnimating.current = true;

        const outX =
            direction === 'right' ? width * 1.8 :
            direction === 'left'  ? -width * 1.8 : 0;
        const outY = direction === 'up' ? -height * 1.8 : 0;

        Animated.timing(position, {
            toValue: { x: outX, y: outY },
            duration: 350,
            useNativeDriver: true,
        }).start(() => {
            const idx = currentIndexRef.current;
            if (direction === 'right') onSwipeRightRef.current?.(idx);
            else if (direction === 'left') onSwipeLeftRef.current?.(idx);
            else if (direction === 'up')  onSwipeTopRef.current?.(idx);

            position.setValue({ x: 0, y: 0 });
            setCurrentIndex(prev => prev + 1);
            isAnimating.current = false;
        });
    }, [position]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !isAnimating.current,
            onMoveShouldSetPanResponder: (_, { dx, dy }) =>
                !isAnimating.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10),

            onPanResponderMove: (_, { dx, dy }) => {
                position.setValue({ x: dx, y: dy });
            },

            onPanResponderRelease: (_, { dx, dy, vx }) => {
                const absX = Math.abs(dx);
                const absY = Math.abs(dy);

                if (absX > SWIPE_THRESHOLD || Math.abs(vx) > 0.8) {
                    const dir = dx > 0 ? 'right' : 'left';
                    const outX = dir === 'right' ? width * 1.8 : -width * 1.8;
                    isAnimating.current = true;
                    Animated.timing(position, {
                        toValue: { x: outX, y: dy },
                        duration: 250,
                        useNativeDriver: true,
                    }).start(() => {
                        const idx = currentIndexRef.current;
                        if (dir === 'right') onSwipeRightRef.current?.(idx);
                        else onSwipeLeftRef.current?.(idx);
                        position.setValue({ x: 0, y: 0 });
                        setCurrentIndex(prev => prev + 1);
                        isAnimating.current = false;
                    });
                } else if (absY > SWIPE_THRESHOLD && dy < 0) {
                    isAnimating.current = true;
                    Animated.timing(position, {
                        toValue: { x: dx, y: -height * 1.8 },
                        duration: 250,
                        useNativeDriver: true,
                    }).start(() => {
                        const idx = currentIndexRef.current;
                        onSwipeTopRef.current?.(idx);
                        position.setValue({ x: 0, y: 0 });
                        setCurrentIndex(prev => prev + 1);
                        isAnimating.current = false;
                    });
                } else {
                    Animated.spring(position, {
                        toValue: { x: 0, y: 0 },
                        friction: 6,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const rotate = position.x.interpolate({
        inputRange: [-width / 2, 0, width / 2],
        outputRange: ['-15deg', '0deg', '15deg'],
        extrapolate: 'clamp',
    });

    const nextScale = position.x.interpolate({
        inputRange: [-width / 2, 0, width / 2],
        outputRange: [1, 0.95, 1],
        extrapolate: 'clamp',
    });

    const likeOpacity = position.x.interpolate({
        inputRange: [20, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const nopeOpacity = position.x.interpolate({
        inputRange: [-100, -20],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const superOpacity = position.y.interpolate({
        inputRange: [-150, -50],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    return {
        currentIndex,
        position,
        panResponder,
        rotate,
        nextScale,
        likeOpacity,
        nopeOpacity,
        superOpacity,
        forceSwipe,
    };
}

const SwipeScreen = () => {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation();
    const { user, profile } = useAuth();

    const [cards, setCards]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [isFetching, setIsFetching]     = useState(false);
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [matchedUser, setMatchedUser]   = useState(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showBoost, setShowBoost]       = useState(false);
    const [filters, setFilters]           = useState({
        maxDistance: 50,
        ageRange: [18, 50],
        interestedIn: profile?.interestedIn || 'Everyone',
        showFurtherAway: false,
        minPhotos: 1,
    });

    const cardsRef = useRef(cards);
    const userRef  = useRef(user);
    useEffect(() => { cardsRef.current = cards; }, [cards]);
    useEffect(() => { userRef.current  = user;  }, [user]);

    const handleAction = useCallback(async (index, type) => {
        const target = cardsRef.current[index];
        const u      = userRef.current;
        if (!target || !u) return;
        try {
            const result = await swipeService.handleSwipe(u.uid, target.id, type);
            if (result?.isMatch) {
                setMatchedUser(target);
                setShowMatchModal(true);
            }
        } catch (e) {
            console.error('Swipe error:', e);
        }
    }, []);

    const handleSwipeLeft  = useCallback((idx) => handleAction(idx, 'pass'),      [handleAction]);
    const handleSwipeRight = useCallback((idx) => handleAction(idx, 'like'),      [handleAction]);
    const handleSwipeTop   = useCallback((idx) => handleAction(idx, 'superlike'), [handleAction]);

    const {
        currentIndex,
        position,
        panResponder,
        rotate,
        nextScale,
        likeOpacity,
        nopeOpacity,
        superOpacity,
        forceSwipe,
    } = useSwiper({
        onSwipeLeft:  handleSwipeLeft,
        onSwipeRight: handleSwipeRight,
        onSwipeTop:   handleSwipeTop,
    });

    useEffect(() => {
        if (user?.uid && profile) fetchCards();
    }, [user?.uid, profile]);

    const fetchCards = async () => {
        if (!user || !profile || isFetching) return;
        setIsFetching(true);
        setLoading(cards.length === 0);
        
        // Safety timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            if (loading) setLoading(false);
        }, 5000);

        try {
            const matches = await swipeService.getPotentialMatches(
                user.uid,
                filters.interestedIn || profile.interestedIn,
                profile.gender,
                { ...filters, userLocation: profile.location }
            );
            setCards(matches);
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            clearTimeout(timeout);
            setIsFetching(false);
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await swipeService.resetSwipes(user.uid);
            await fetchCards();
        } catch (e) {
            Alert.alert('Error', 'Failed to reset swipes.');
        } finally {
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

    const renderCards = () => {
        if (!hasCards) {
            return (
                <View style={styles.center}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
                        <Ionicons name="sparkles" size={60} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up!</Text>
                    <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                        You've seen everyone in your area. Try adjusting your filters or check back later.
                    </Text>
                    
                    <TouchableOpacity 
                        style={[styles.primaryActionBtn, { backgroundColor: COLORS.primary }]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Text style={styles.primaryActionText}>Adjust Filters</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.resetLink} onPress={handleReset}>
                        <Text style={[styles.resetLinkText, { color: colors.textSecondary }]}>Refresh Feed</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const stack = [];

        if (currentIndex + 1 < cards.length) {
            stack.push(
                <Animated.View
                    key={`next_${cards[currentIndex + 1].id}`}
                    pointerEvents="none"
                    style={[
                        styles.cardWrapper,
                        {
                            zIndex: 10,
                            transform: [{ scale: nextScale }],
                        },
                    ]}
                >
                    <SwipeCard
                        profile={cards[currentIndex + 1]}
                        currentUserLocation={profile?.location}
                    />
                </Animated.View>
            );
        }

        stack.push(
            <Animated.View
                key={`current_${cards[currentIndex].id}`}
                style={[
                    styles.cardWrapper,
                    {
                        zIndex: 20,
                        transform: [
                            { translateX: position.x },
                            { translateY: position.y },
                            { rotate },
                        ],
                    },
                ]}
                {...panResponder.panHandlers}
            >
                <Animated.View style={[styles.overlayLabel, styles.likeLabel, { opacity: likeOpacity }]}>
                    <View style={[styles.overlayBox, { borderColor: '#00FF88' }]}>
                        <Text style={[styles.overlayText, { color: '#00FF88' }]}>LIKE</Text>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.overlayLabel, styles.nopeLabel, { opacity: nopeOpacity }]}>
                    <View style={[styles.overlayBox, { borderColor: COLORS.primary }]}>
                        <Text style={[styles.overlayText, { color: COLORS.primary }]}>NOPE</Text>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.overlayLabel, styles.superLabel, { opacity: superOpacity }]}>
                    <View style={[styles.overlayBox, { borderColor: '#00D1FF' }]}>
                        <Text style={[styles.overlayText, { color: '#00D1FF' }]}>SUPER</Text>
                    </View>
                </Animated.View>

                <SwipeCard
                    profile={cards[currentIndex]}
                    currentUserLocation={profile?.location}
                />
            </Animated.View>
        );

        return stack;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Minimalist Header */}
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

            {/* Main Swiper Area */}
            <View style={styles.swiperContainer}>{renderCards()}</View>

            {/* Modern Action Dock */}
            {hasCards && (
                <View style={styles.footerDock}>
                    <TouchableOpacity
                        style={[styles.dockBtn, styles.dockBtnSmall, { backgroundColor: colors.surface }]}
                        onPress={() => Alert.alert('Premium Required', 'Rewind is available with Spark Platinum.')}
                    >
                        <Ionicons name="refresh" size={20} color="#FFD700" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.dockBtn, styles.dockBtnLarge, { backgroundColor: colors.surface }]}
                        onPress={() => forceSwipe('left')}
                    >
                        <Ionicons name="close" size={36} color={COLORS.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.dockBtn, styles.dockBtnLarge, { backgroundColor: colors.surface }]}
                        onPress={() => forceSwipe('right')}
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
                onSendMessage={() => {
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
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    headerLogo: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 3,
    },
    logoDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginBottom: 6,
        marginLeft: 2,
    },
    swiperContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardWrapper: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
            },
            android: { elevation: 12 }
        })
    },
    overlayLabel: {
        position: 'absolute',
        zIndex: 99,
    },
    likeLabel:  { top: 50, left: 30,  transform: [{ rotate: '-20deg' }] },
    nopeLabel:  { top: 50, right: 30, transform: [{ rotate: '20deg'  }] },
    superLabel: { bottom: 120, alignSelf: 'center' },
    overlayBox: {
        borderWidth: 4,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    overlayText: {
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: 2,
    },
    footerDock: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: LAYOUT.TAB_BAR_HEIGHT + 60,
        gap: 15,
    },
    dockBtn: {
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: { elevation: 6 }
        })
    },
    dockBtnSmall: { width: 44, height: 44, opacity: 0.9 },
    dockBtnMed:   { width: 52, height: 52, opacity: 0.95 },
    dockBtnLarge: { width: 70, height: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },

    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
    },
    emptyTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12 },
    emptySub:   { fontSize: 15, textAlign: 'center', opacity: 0.6, lineHeight: 22, marginBottom: 35 },
    primaryActionBtn: {
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 20,
        marginBottom: 20,
    },
    primaryActionText: { color: 'white', fontWeight: '800', fontSize: 16 },
    resetLink: { padding: 10 },
    resetLinkText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' }
});

export default SwipeScreen;