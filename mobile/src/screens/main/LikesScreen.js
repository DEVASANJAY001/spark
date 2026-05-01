import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Platform, Animated, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { swipeService } from '../../services/swipeService';
import AdBanner from '../../components/AdBanner';

import { subscriptionService } from '../../services/subscriptionService';
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatService';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const LikeCard = ({ item, matchedUids, currentUid, navigation, colors, hasSeeLikes, profile }) => {
    const isSuperLike = item.swipeType === 'superlike';
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isSuperLike) return;
        Animated.loop(
            Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true })
        ).start();
    }, [isSuperLike]);

    const shimmerTranslate = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-150, 150] });
    const isMatched = matchedUids.has(item.uid);

    const handlePress = async () => {
        if (!hasSeeLikes) {
            navigation.navigate('Subscriptions');
            return;
        }

        // Subscribed users or Mutual matches or SuperLikes can chat
        if (hasSeeLikes || isMatched || isSuperLike) {
            // Check chat limit before navigating
            const canStart = await chatService.canStartNewChat(currentUid, profile?.premiumTier);
            
            if (!canStart) {
                const limit = userService.getChatLimit(profile?.premiumTier);
                Alert.alert(
                    'Chat Capacity Full',
                    `Your current plan allows for ${limit} active conversations. Upgrade to unlock more capacity!`,
                    [
                        { text: 'Later', style: 'cancel' },
                        { text: 'Upgrade', onPress: () => navigation.navigate('Subscriptions') }
                    ]
                );
                return;
            }

            // Get or create match (crucial for subscription-unlocked profiles)
            const matchData = await chatService.getOrCreateMatch(currentUid, item.uid);
            navigation.navigate('Chat', { 
                screen: 'ChatDetail', 
                params: { 
                    matchId: matchData.id, 
                    otherUser: item, 
                    viaSuperLike: isSuperLike 
                } 
            });
        }
    };

    return (
        <TouchableOpacity style={[styles.likeCard, { backgroundColor: colors.surface }]} onPress={handlePress} activeOpacity={0.9}>
            <Image
                source={{ uri: (Array.isArray(item.photos) && item.photos[0]) || 'https://picsum.photos/400' }}
                style={styles.image}
                blurRadius={hasSeeLikes ? 0 : 50}
            />

            {!hasSeeLikes && (
                <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={32} color="white" />
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', marginTop: 8 }}>PREMIUM</Text>
                    </View>
                </BlurView>
            )}

            {isSuperLike && (
                <View style={styles.superLikeBadgeWrap}>
                    <LinearGradient
                        colors={['#1A73E8', '#1557B0']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.superLikeBadge}
                    >
                        <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
                        <Ionicons name="star" size={12} color="white" />
                        <Text style={styles.superLikeText}>SUPER LIKE</Text>
                    </LinearGradient>
                </View>
            )}

            <View style={styles.cardBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>ONLINE</Text>
            </View>

            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']}
                style={styles.cardInfo}
            >
                <Text style={styles.nameLabel}>
                    {item.firstName}{(!item.firstName?.includes(item.age?.toString()) && item.age) ? `, ${item.age}` : ''}
                </Text>
                {(isMatched || isSuperLike) && (
                    <View style={styles.chatHintRow}>
                        <Ionicons name="chatbubble-ellipses" size={12} color={isSuperLike ? "#42A5F5" : "#00FF88"} />
                        <Text style={[styles.chatHint, { color: isSuperLike ? "#42A5F5" : "#00FF88" }]}>
                            {isSuperLike ? "Priority Chat" : "Matched!"}
                        </Text>
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const LikesScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const { user, profile } = useAuth();
    const [likes, setLikes] = useState([]);
    const [likesCount, setLikesCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [matchedUids, setMatchedUids] = useState(new Set());
    const [topPicks, setTopPicks] = useState([]);
    const [loadingPicks, setLoadingPicks] = useState(false);
    const [activeTab, setActiveTab] = useState('Likes');
    const [subscription, setSubscription] = useState(null);

    const hasSeeLikes = userService.canUseFeature(profile, 'see_likes');
    const hasTopPicks = userService.canUseFeature(profile, 'top_picks');

    useEffect(() => {
        if (user && profile) {
            const unsubscribeLikes = swipeService.getLikes(user.uid, ({ likes, count }) => {
                setLikes(likes);
                setLikesCount(count);
                setLoading(false);
            });
            const unsubscribeMatches = swipeService.getMatches(user.uid, (uids) => {
                setMatchedUids(uids);
            });
            loadSubscription();
            fetchTopPicks();
            return () => {
                unsubscribeLikes();
                unsubscribeMatches();
            };
        }
    }, [user, profile?.interestedIn, profile?.premiumTier]);

    const loadSubscription = async () => {
        if (!user?.uid || !profile?.premiumTier) {
            setSubscription(null);
            return;
        }
        const sub = await subscriptionService.getUserSubscription(user.uid, profile.premiumTier);
        setSubscription(sub);
    };

    const fetchTopPicks = async () => {
        if (!user || !profile) return;
        setLoadingPicks(true);
        try {
            const picks = await swipeService.getTopPicks(user.uid, profile.interestedIn || 'Everyone');
            setTopPicks(picks);
        } catch (error) {
            console.error('Error fetching top picks:', error);
        } finally {
            setLoadingPicks(false);
        }
    };

    const handleLikeTopPick = async (targetUser) => {
        if (!user) return;
        
        // Optimistic UI or simple confirmation
        Alert.alert(
            `Like ${targetUser.firstName}?`,
            `Send a like to ${targetUser.firstName} and see if it's a match!`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Like',
                    onPress: async () => {
                        try {
                            const result = await swipeService.handleSwipe(user.uid, targetUser.id || targetUser.uid, 'like');
                            if (result?.isMatch) {
                                Alert.alert("It's a Match!", `You and ${targetUser.firstName} have liked each other.`);
                                // Navigate to chat automatically on mutual match
                                const matchData = await chatService.getOrCreateMatch(user.uid, targetUser.id || targetUser.uid);
                                navigation.navigate('Chat', { 
                                    screen: 'ChatDetail', 
                                    params: { matchId: matchData.id, otherUser: targetUser } 
                                });
                            } else {
                                Alert.alert("Like Sent!", `We'll let ${targetUser.firstName} know!`);
                            }
                            // Refresh picks to remove the liked one
                            fetchTopPicks();
                        } catch (error) {
                            Alert.alert("Error", "Failed to send like. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* High-End Header */}
            <View style={styles.header}>
                <View style={[styles.topTabs, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'Likes' && styles.activeTabItem]}
                        onPress={() => setActiveTab('Likes')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'Likes' ? colors.text : colors.textSecondary }]}>
                            {likesCount} LIKES
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'Top Picks' && styles.activeTabItem]}
                        onPress={() => setActiveTab('Top Picks')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'Top Picks' ? colors.text : colors.textSecondary }]}>
                            TOP PICKS
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {activeTab === 'Likes' ? (
                <FlatList
                    data={likes}
                    numColumns={2}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <LikeCard
                            item={item}
                            matchedUids={matchedUids}
                            currentUid={user?.uid}
                            navigation={navigation}
                            colors={colors}
                            hasSeeLikes={hasSeeLikes}
                            profile={profile}
                        />
                    )}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.likesList}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={6}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}
                    ListHeaderComponent={
                        <View style={{ paddingHorizontal: 15, paddingTop: 10 }}>
                            <AdBanner placement="likes_top" style={{ height: 100 }} />
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
                                <Ionicons name="heart-half-outline" size={60} color={colors.textSecondary} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Likes Yet</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>People who like you will appear here.</Text>
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                                onPress={() => navigation.navigate('Swipe')}
                            >
                                <Text style={styles.actionBtnText}>Keep Swiping</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            ) : (
                <View style={{ flex: 1 }}>
                    {loadingPicks ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : !hasTopPicks ? (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
                                <Ionicons name="star" size={60} color="#FFD700" />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>Top Picks</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                Daily curated list of high-compatibility profiles just for you. Upgrade to Gold or Platinum to see them!
                            </Text>
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#FFD700' }]}
                                onPress={() => navigation.navigate('Subscriptions')}
                            >
                                <Text style={[styles.actionBtnText, { color: '#000' }]}>Upgrade to Gold</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={topPicks}
                            numColumns={2}
                            keyExtractor={(item) => item.id || item.uid}
                            contentContainerStyle={styles.gridContent}
                            initialNumToRender={4}
                            maxToRenderPerBatch={6}
                            windowSize={3}
                            removeClippedSubviews={Platform.OS === 'android'}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.likeCard, { backgroundColor: colors.surface }]}
                                    activeOpacity={0.9}
                                    onPress={() => handleLikeTopPick(item)}
                                >
                                    <Image source={{ uri: (Array.isArray(item.photos) && item.photos[0]) || 'https://picsum.photos/400' }} style={styles.image} />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.85)']}
                                        style={styles.cardInfo}
                                    >
                                        <Text style={styles.nameLabel}>
                                            {item.firstName}{(!item.firstName?.includes(item.age?.toString()) && item.age) ? `, ${item.age}` : ''}
                                        </Text>
                                        <Text style={styles.pickReason}>{item.interests?.[0] || 'Top Match'}</Text>
                                    </LinearGradient>
                                    <View style={styles.pickBadge}>
                                        <Ionicons name="flash" size={12} color="white" />
                                        <Text style={styles.pickBadgeText}>TOP PICK</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListHeaderComponent={
                                <View style={{ paddingHorizontal: 15, paddingTop: 10 }}>
                                    <AdBanner placement="likes_top" style={{ height: 100 }} />
                                </View>
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
                                        <Ionicons name="star-outline" size={60} color={colors.textSecondary} />
                                    </View>
                                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Picks Available</Text>
                                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Check back later for curated profiles.</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 15, paddingBottom: LAYOUT.TAB_BAR_HEIGHT + 20 },
    topTabs: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 5,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTabItem: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
    },
    gridContent: {
        paddingHorizontal: 15,
        paddingBottom: LAYOUT.TAB_BAR_HEIGHT + 40,
    },
    likeCard: {
        width: (width - 45) / 2,
        aspectRatio: 0.72,
        margin: 7.5,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    image: { width: '100%', height: '100%' },
    superLikeBadgeWrap: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        borderRadius: 10,
        overflow: 'hidden',
    },
    superLikeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 60,
        backgroundColor: 'rgba(255,255,255,0.3)',
        transform: [{ skewX: '-30deg' }],
    },
    superLikeText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    cardBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 5,
    },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00FF88' },
    activeText: { color: 'white', fontSize: 10, fontWeight: '800' },
    cardInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        justifyContent: 'flex-end',
    },
    nameLabel: { color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: -0.2 },
    chatHintRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
    chatHint: { fontSize: 12, fontWeight: '700' },
    pickReason: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 2 },
    pickBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    pickBadgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 120,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
    },
    emptyTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
    emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
    actionBtn: { paddingHorizontal: 35, paddingVertical: 16, borderRadius: 20 },
    actionBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    lockOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default LikesScreen;
