import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import SwipeCard from '../../components/SwipeCard';
import MatchCelebrationModal from '../../components/MatchCelebrationModal';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { swipeService } from '../../services/swipeService';

const { width } = Dimensions.get('window');

const SwipeScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const { user, profile } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cardIndex, setCardIndex] = useState(0);
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [matchedUser, setMatchedUser] = useState(null);
    const swiperRef = useRef(null);

    useEffect(() => {
        fetchMatches();
    }, [user, profile]);

    const fetchMatches = async () => {
        if (!user || !profile) return;
        setLoading(true);
        try {
            const matches = await swipeService.getPotentialMatches(
                user.uid,
                profile.interestedIn,
                profile.gender
            );
            setCards(matches);
            setCardIndex(0);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSwipe = async (index, type) => {
        const targetUser = cards[index];
        if (!targetUser || !user) return;

        // Check Swipe Limit for free users
        if (type === 'like') {
            const canSwipe = await userService.checkSwipeLimit(user.uid, profile);
            if (!canSwipe) {
                Alert.alert(
                    "Daily Limit Reached",
                    "Upgrade to Spark Plus for unlimited likes!",
                    [
                        { text: "Later", style: "cancel" },
                        { text: "Upgrade", onPress: () => navigation.navigate('Profile', { screen: 'Subscription' }) }
                    ]
                );
                swiperRef.current?.swipeBack();
                return;
            }
        }

        try {
            const result = await swipeService.handleSwipe(user.uid, targetUser.id, type);
            
            if (type === 'like') {
                await userService.incrementSwipeCount(user.uid, profile);
            }

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
        
        const canRewind = userService.canUseFeature(profile, 'rewind');
        if (!canRewind) {
            Alert.alert(
                "Spark Plus Feature",
                "Upgrade to Spark Plus to rewind your swipes!",
                [
                    { text: "Later", style: "cancel" },
                    { text: "Upgrade", onPress: () => navigation.navigate('Subscription') }
                ]
            );
            return;
        }

        setLoading(true);
        try {
            await swipeService.resetSwipes(user.uid);
            await fetchMatches();
            Alert.alert("Reset", "Profiles are available again!");
        } catch (error) {
            console.error('Error resetting:', error);
            Alert.alert("Error", "Failed to reset swipes.");
        } finally {
            setLoading(false);
        }
    };

    const renderEmptyState = () => (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <View style={styles.emptyCircle}>
                <Ionicons name="people-outline" size={80} color={COLORS.primary} style={{ opacity: 0.2 }} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No one new around you.</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Try expanding your filters or reset your history.</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>Reset Swipes</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Finding matches...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'Settings' })}>
                    <Ionicons name="options" size={26} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>spark</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Subscription')}>
                    <LinearGradient colors={[COLORS.primary, '#ff7854']} style={styles.headerAction}>
                        <Ionicons name="flash" size={18} color="white" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Swiper */}
            <View style={styles.swiperContainer} pointerEvents="box-none">
                {cards.length > 0 ? (
                    <Swiper
                        ref={swiperRef}
                        cards={cards}
                        renderCard={(card) => (
                            <SwipeCard 
                                profile={card} 
                                currentUserLocation={profile?.location} 
                            />
                        )}
                        onSwipedLeft={(index) => handleSwipe(index, 'pass')}
                        onSwipedRight={(index) => handleSwipe(index, 'like')}
                        onSwipedTop={(index) => handleSwipe(index, 'like')}
                        onSwipedBottom={(index) => handleSwipe(index, 'pass')}
                        cardIndex={cardIndex}
                        backgroundColor={'transparent'}
                        stackSize={3}
                        stackScale={5}
                        stackSeparation={14}
                        disableBottomSwipe={true}
                        animateCardOpacity
                        infinite={false}
                        onSwipedAll={() => setCards([])}
                        containerStyle={styles.swiperInnerContainer}
                        overlayLabels={{
                            left: {
                                title: 'NOPE',
                                style: {
                                    label: { borderColor: COLORS.primary, color: COLORS.primary, borderWidth: 4, fontSize: 32, fontWeight: 'bold', padding: 10 },
                                    wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -30 }
                                }
                            },
                            right: {
                                title: 'LIKE',
                                style: {
                                    label: { borderColor: '#00e882', color: '#00e882', borderWidth: 4, fontSize: 32, fontWeight: 'bold', padding: 10 },
                                    wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 30, marginLeft: 30 }
                                }
                            }
                        }}
                    />
                ) : renderEmptyState()}
            </View>

            {/* Actions */}
            {cards.length > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.smallAction} onPress={handleReset}>
                        <Ionicons name="reload" size={24} color="#f2a122" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.largeAction, { borderColor: COLORS.primary }]} 
                        onPress={() => swiperRef.current?.swipeLeft()}
                    >
                        <Ionicons name="close" size={36} color={COLORS.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallAction} onPress={() => navigation.navigate('Profile', { screen: 'Subscription' })}>
                        <Ionicons name="star" size={24} color={COLORS.blue} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.largeAction, { borderColor: '#00e882' }]} 
                        onPress={() => swiperRef.current?.swipeRight()}
                    >
                        <Ionicons name="heart" size={36} color="#00e882" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.smallAction} onPress={() => navigation.navigate('Profile', { screen: 'Subscription' })}>
                        <Ionicons name="flash" size={24} color="#a15df9" />
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
                        params: { matchId, otherUser: matchedUser }
                    });
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 60,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.primary,
        letterSpacing: -1.5,
    },
    headerAction: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    swiperContainer: { 
        flex: 1,
        width: '100%',
    },
    swiperInnerContainer: {
        height: '85%', 
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: 15,
        paddingBottom: 5, 
        backgroundColor: 'transparent',
        zIndex: 100,
        elevation: 10,
    },
    smallAction: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(20,20,20,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    largeAction: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(20,20,20,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    emptyCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    emptySubtext: { fontSize: 14, textAlign: 'center', opacity: 0.6, marginBottom: 30 },
    resetBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    resetBtnText: { color: 'white', fontWeight: 'bold' }
});

export default SwipeScreen;
