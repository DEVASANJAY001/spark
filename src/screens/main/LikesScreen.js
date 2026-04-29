import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import UpgradeModal from '../../components/UpgradeModal';
import { swipeService } from '../../services/swipeService';
import { ref, get } from 'firebase/database';
import { rtdb } from '../../firebase/config';
import { userService } from '../../services/userService';

const LikesScreen = () => {
    const { colors } = useTheme();
    const { user, profile } = useAuth();
    const [likes, setLikes] = useState([]);
    const [likesCount, setLikesCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [upgradeVisible, setUpgradeVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('Likes');
    const [upgradeTier, setUpgradeTier] = useState('gold');
    const [matchedUids, setMatchedUids] = useState(new Set());

    const openUpgrade = (tier) => {
        setUpgradeTier(tier);
        setUpgradeVisible(true);
    };

    const filters = [
        { id: 'filter', icon: 'options-outline' },
        { id: 'nearby', label: 'Nearby' },
        { id: 'bio', label: 'Has a Bio' },
        { id: 'verified', label: 'Photo Verified' },
    ];

    const topPicks = [
        { id: '1', firstName: 'Sarah', age: 24, photos: ['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800'], expiresAt: '14h left', interest: 'Foodie' },
        { id: '2', firstName: 'Emma', age: 22, photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'], expiresAt: '10h left', interest: 'Traveler' },
        { id: '3', firstName: 'Olivia', age: 25, photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'], expiresAt: '8h left', interest: 'Music' },
        { id: '4', firstName: 'Ava', age: 23, photos: ['https://images.unsplash.com/photo-1464863979621-258859e62245?w=400'], expiresAt: '4h left', interest: 'Art' },
    ];

    useEffect(() => {
        if (user) {
            const unsubscribeLikes = swipeService.getLikes(user.uid, ({ likes, count }) => {
                setLikes(likes);
                setLikesCount(count);
                setLoading(false);
            });

            const unsubscribeMatches = swipeService.getMatches(user.uid, (uids) => {
                setMatchedUids(uids);
            });

            return () => {
                unsubscribeLikes();
                unsubscribeMatches();
            };
        }
    }, [user]);

    const renderFilterChip = ({ item }) => (
        <TouchableOpacity style={styles.filterChip}>
            {item.icon ? (
                <Ionicons name={item.icon} size={18} color="#666" />
            ) : (
                <Text style={styles.filterChipText}>{item.label}</Text>
            )}
        </TouchableOpacity>
    );

    const renderLikeCard = ({ item, index }) => {
        const isPremium = profile?.hasPremium || profile?.premiumTier === 'gold' || profile?.premiumTier === 'platinum';
        const isMatched = matchedUids.has(item.uid);
        const shouldUnblur = isPremium || isMatched;

        if (!isPremium && index === 0 && likesCount > 0 && !isMatched) {
            return (
                <TouchableOpacity
                    style={styles.likeCard}
                    onPress={() => openUpgrade('gold')}
                >
                    <Image
                        source={{ uri: (Array.isArray(item.photos) && item.photos[0]) || 'https://picsum.photos/400' }}
                        style={styles.image}
                        blurRadius={40}
                    />
                    <LinearGradient
                        colors={['rgba(212, 175, 55, 0.4)', 'rgba(212, 175, 55, 0.8)']}
                        style={styles.goldOverlay}
                    >
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{likesCount > 25 ? '25+' : likesCount}</Text>
                        </View>
                        <Text style={styles.likesLabel}>Likes</Text>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                style={styles.likeCard}
                onPress={() => shouldUnblur ? console.log('Open Profile', item.uid) : openUpgrade('gold')}
            >
                <Image
                    source={{ uri: (Array.isArray(item.photos) && item.photos[0]) || 'https://picsum.photos/400' }}
                    style={styles.image}
                    blurRadius={shouldUnblur ? 0 : 30}
                />

                {!shouldUnblur && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={24} color="white" />
                    </View>
                )}

                <View style={styles.cardBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Recently Active</Text>
                </View>

                {shouldUnblur && (
                    <View style={styles.cardInfo}>
                        <Text style={styles.nameLabel}>{item.firstName}, {item.age}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <View style={[styles.topTabBar, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'Likes' && styles.activeTabItem, activeTab === 'Likes' && { borderBottomColor: colors.primary }]}
                        onPress={() => setActiveTab('Likes')}
                    >
                        <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'Likes' && { color: colors.text, fontWeight: 'bold' }]}>
                            {likesCount > 99 ? '99+' : likesCount} Likes
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'Top Picks' && styles.activeTabItem, activeTab === 'Top Picks' && { borderBottomColor: colors.primary }]}
                        onPress={() => setActiveTab('Top Picks')}
                    >
                        <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'Top Picks' && { color: colors.text, fontWeight: 'bold' }]}>
                            Top Picks
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterRow}>
                    <FlatList
                        data={filters}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={renderFilterChip}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.filterList}
                    />
                </View>
            </View>

            {activeTab === 'Likes' ? (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={likes}
                        numColumns={2}
                        keyExtractor={(item) => item.id || item.uid}
                        renderItem={renderLikeCard}
                        contentContainerStyle={styles.list}
                        ListHeaderComponent={
                            !(profile?.hasPremium) ? (
                                <TouchableOpacity style={styles.upgradeNotice} onPress={() => openUpgrade('gold')}>
                                    <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.upgradeNoticeGradient}>
                                        <Ionicons name="diamond" size={18} color="white" />
                                        <Text style={styles.upgradeNoticeText}>
                                            Upgrade to Spark Gold to see who already liked you
                                        </Text>
                                        <Ionicons name="chevron-forward" size={18} color="white" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="heart" size={64} color="#333" />
                                <Text style={styles.emptyText}>No likes yet. Keep swiping!</Text>
                            </View>
                        }
                    />

                    {!(profile?.hasPremium) && (
                        <TouchableOpacity
                            style={styles.floatingCta}
                            onPress={() => openUpgrade('gold')}
                        >
                            <LinearGradient
                                colors={['#D4AF37', '#FFD700']}
                                style={styles.ctaGradient}
                            >
                                <Text style={styles.ctaText}>See who Likes you</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={topPicks}
                        numColumns={2}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        ListHeaderComponent={
                            <View style={styles.upgradeBanner}>
                                <Text style={styles.upgradeBannerText}>Upgrade to Spark Gold™ for more Top Picks!</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.likeCard}>
                                <Image source={{ uri: item.photos[0] }} style={styles.image} />
                                <View style={styles.overlay}>
                                    <Text style={styles.name}>{item.firstName}, {item.age}</Text>
                                    <Text style={styles.expiresText}>{item.expiresAt}</Text>
                                </View>
                                {item.interest && (
                                    <Text style={styles.interestLabel}>{item.interest}</Text>
                                )}
                                <TouchableOpacity
                                    style={styles.superLikeShortcut}
                                    onPress={() => openUpgrade('platinum')}
                                >
                                    <Ionicons name="star" size={16} color={COLORS.blue} />
                                </TouchableOpacity>
                            </View>
                        )}
                        ListFooterComponent={
                            <TouchableOpacity
                                style={styles.unlockButton}
                                onPress={() => openUpgrade('gold')}
                            >
                                <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.unlockGradient}>
                                    <Text style={styles.unlockButtonText}>Unlock all Top Picks</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        }
                    />
                </View>
            )}

            <UpgradeModal
                visible={upgradeVisible}
                onClose={() => setUpgradeVisible(false)}
                tier={upgradeTier}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        backgroundColor: '#000',
        zIndex: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    topTabBar: {
        flexDirection: 'row',
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        paddingHorizontal: 20,
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTabItem: {
        borderBottomWidth: 3,
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#666',
        textTransform: 'uppercase',
    },
    activeTabText: {
        color: 'white',
    },
    filterRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    filterList: {
        paddingHorizontal: 15,
    },
    filterChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 46,
        backgroundColor: '#111',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ccc',
    },
    upgradeNotice: {
        marginHorizontal: 5,
        marginVertical: 15,
        borderRadius: 12,
        overflow: 'hidden',
    },
    upgradeNoticeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    upgradeNoticeText: {
        fontSize: 14,
        fontWeight: '800',
        color: 'white',
        textAlign: 'center',
        marginHorizontal: 10,
    },
    list: {
        padding: 8,
        paddingBottom: 120,
    },
    likeCard: {
        width: '47%',
        aspectRatio: 0.75,
        margin: '1.5%',
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#222',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    cardBadge: {
        position: 'absolute',
        bottom: 12,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00e882',
        marginRight: 6,
    },
    activeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 12,
        justifyContent: 'flex-end',
    },
    nameLabel: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    floatingCta: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        width: 240,
        height: 54,
        borderRadius: 27,
        overflow: 'hidden',
        ...Platform.select({
            web: { boxShadow: '0px 8px 20px rgba(0,0,0,0.5)' },
            default: { elevation: 12 }
        })
    },
    ctaGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    goldOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    countBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#D4AF37',
        borderWidth: 3,
        borderColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 10px rgba(0,0,0,0.3)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 8,
            }
        })
    },
    countBadgeText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    likesLabel: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    upgradeBanner: {
        backgroundColor: '#1a1810',
        padding: 18,
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#3a3210',
    },
    upgradeBannerText: {
        color: '#D4AF37',
        fontWeight: 'bold',
        fontSize: 12,
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    name: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    expiresText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        marginTop: 4,
    },
    interestLabel: {
        position: 'absolute',
        top: 12,
        left: 12,
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    superLikeShortcut: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'white',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
            }
        })
    },
    unlockButton: {
        marginVertical: 30,
        marginHorizontal: 30,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
    },
    unlockGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unlockButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 120,
    },
    emptyText: {
        marginTop: 24,
        color: '#444',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default LikesScreen;
