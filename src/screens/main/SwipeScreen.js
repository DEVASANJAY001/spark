import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, Dimensions, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Swiper from 'react-native-deck-swiper';
import SwipeCard from '../../components/SwipeCard';
import UpgradeModal from '../../components/UpgradeModal';
import MatchCelebrationModal from '../../components/MatchCelebrationModal';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { swipeService } from '../../services/swipeService';
import Wordmark from '../../../assets/wordmark.jpg';

const { width, height } = Dimensions.get('window');

const SwipeScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const { user, profile } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cardIndex, setCardIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('For You');
    const [upgradeVisible, setUpgradeVisible] = useState(false);
    const [upgradeTier, setUpgradeTier] = useState('gold');
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [matchedUser, setMatchedUser] = useState(null);
    const swiperRef = useRef(null);

    const subTabs = ['For You', 'Double Date', 'Astrology', 'Music'];

    const openUpgrade = (tier) => {
        setUpgradeTier(tier);
        setUpgradeVisible(true);
    };

    const handleTabPress = (tab) => {
        if (tab !== 'For You') {
            openUpgrade('plus');
        } else {
            setActiveTab(tab);
        }
    };

    useEffect(() => {
        const fetchMatches = async () => {
            if (user && profile) {
                try {
                    const matches = await swipeService.getPotentialMatches(
                        user.uid,
                        profile.interestedIn,
                        profile.gender
                    );
                    setCards(matches);
                } catch (error) {
                    console.error('Error fetching matches:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchMatches();
    }, [user, profile]);

    const handleSwipe = async (index, type) => {
        const targetUser = cards[index];
        if (!targetUser || !user) return;

        try {
            const result = await swipeService.handleSwipe(user.uid, targetUser.id, type);
            if (result?.isMatch) {
                setMatchedUser(targetUser);
                setShowMatchModal(true);
            }
        } catch (error) {
            console.error('Error handling swipe:', error);
        }
    };

    const handleReset = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await swipeService.resetSwipes(user.uid);
            const matches = await swipeService.getPotentialMatches(
                user.uid,
                profile?.interestedIn,
                profile?.gender
            );
            setCards(matches);
            setCardIndex(0);
            Alert.alert("Reset", "Swipe history cleared. Profiles are available again!");
        } catch (error) {
            console.error('Error resetting:', error);
            Alert.alert("Error", "Failed to reset swipes.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (cards.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="flame" size={80} color={COLORS.primary} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyText}>No one new around you.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity>
                    <Ionicons name="options-outline" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                <Image source={Wordmark} style={styles.headerLogo} tintColor={colors.primary} resizeMode="contain" />

                <TouchableOpacity style={[styles.boostIcon, { backgroundColor: colors.surface }]} onPress={() => openUpgrade('gold')}>
                    <Ionicons name="flash" size={20} color="#a15df9" />
                </TouchableOpacity>
            </View>

            <View style={styles.swiperContainer}>
                <Swiper
                    ref={swiperRef}
                    cards={cards}
                    renderCard={(card) => <SwipeCard profile={card} />}
                    onSwipedLeft={(index) => handleSwipe(index, 'pass')}
                    onSwipedRight={(index) => handleSwipe(index, 'like')}
                    onSwipedAll={() => setCards([])}
                    cardIndex={cardIndex}
                    backgroundColor={'transparent'}
                    stackSize={3}
                    infinite={false}
                    animateCardOpacity
                    disableTopSwipe
                    disableBottomSwipe
                    overlayLabels={{
                        left: {
                            title: 'NOPE',
                            style: {
                                label: {
                                    backgroundColor: 'transparent',
                                    borderColor: COLORS.primary,
                                    color: COLORS.primary,
                                    borderWidth: 5,
                                    fontSize: 32,
                                    fontWeight: '900',
                                    padding: 10,
                                    textAlign: 'center'
                                },
                                wrapper: {
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    justifyContent: 'flex-start',
                                    marginTop: 30,
                                    marginLeft: -30
                                }
                            }
                        },
                        right: {
                            title: 'LIKE',
                            style: {
                                label: {
                                    backgroundColor: 'transparent',
                                    borderColor: '#00e882',
                                    color: '#00e882',
                                    borderWidth: 5,
                                    fontSize: 32,
                                    fontWeight: '900',
                                    padding: 10,
                                    textAlign: 'center'
                                },
                                wrapper: {
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-start',
                                    marginTop: 30,
                                    marginLeft: 30
                                }
                            }
                        }
                    }}
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        Alert.alert(
                            "Reload Profiles",
                            "Do you want to reset your swipe history to see these people again?",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Reset History", onPress: handleReset }
                            ]
                        );
                    }}
                >
                    <Ionicons name="reload" size={22} color="#f2a122" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.mainActionButton]} onPress={() => swiperRef.current?.swipeLeft()}>
                    <Ionicons name="close" size={32} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => openUpgrade('gold')}>
                    <Ionicons name="star" size={22} color={COLORS.blue} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.mainActionButton]} onPress={() => swiperRef.current?.swipeRight()}>
                    <Ionicons name="heart" size={32} color="#00e882" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => openUpgrade('gold')}>
                    <Ionicons name="flash" size={22} color="#a15df9" />
                </TouchableOpacity>
            </View>

            <UpgradeModal
                visible={upgradeVisible}
                onClose={() => setUpgradeVisible(false)}
                tier={upgradeTier}
            />

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
                        params: {
                            matchId,
                            otherUser: matchedUser,
                            createdAt: { seconds: Date.now() / 1000 } // Approximation for local navigation
                        }
                    });
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    emptyText: {
        marginTop: 20,
        fontSize: 18,
        color: COLORS.lightGrey,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        height: 60,
    },
    headerLogo: {
        width: 90,
        height: 30,
        tintColor: '#fd267d',
    },
    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        padding: 2,
    },
    pill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
    },
    activePill: {
        backgroundColor: 'white',
        ...Platform.select({
            web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' },
            default: { elevation: 2 }
        })
    },
    pillText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.lightGrey,
    },
    activePillText: {
        color: COLORS.dark,
    },
    boostIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    swiperContainer: {
        flex: 1,
    },
    card: {
        flex: 0.85,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'white',
        ...Platform.select({
            web: {
                boxShadow: '0px 10px 10px rgba(0,0,0,0.2)',
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 5,
            }
        })
    },
    image: {
        width: '100%',
        height: '100%',
    },
    cardInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nearbyBadge: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,180,0,0.8)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    nearbyText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    scrollButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    distance: {
        fontSize: 16,
        color: 'white',
        marginLeft: 5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: SPACING.m,
    },
    actionButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
            }
        })
    },
    mainActionButton: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
    }
});

export default SwipeScreen;