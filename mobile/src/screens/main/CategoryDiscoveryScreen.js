import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-deck-swiper';
import SwipeCard from '../../components/SwipeCard';
import { swipeService } from '../../services/swipeService';
import { BRAND_COLORS } from '../../constants/theme';
import useAuth from '../../hooks/useAuth';

const { width, height } = Dimensions.get('window');

const CategoryDiscoveryScreen = ({ route, navigation }) => {
    const { category, title } = route.params;
    const { user, profile } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const swiperRef = useRef(null);

    useEffect(() => {
        if (user && category) {
            fetchProfiles();
        }
    }, [user, category]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const results = await swipeService.getProfilesByCategory(user.uid, category, profile?.interestedIn || 'Everyone');
            setProfiles(results);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSwiped = async (index, type) => {
        const targetUser = profiles[index];
        if (!targetUser) return;

        try {
            const result = await swipeService.handleSwipe(user.uid, targetUser.id, type);
            if (result.isMatch) {
                // Show match celebration if needed
                Alert.alert("It's a Match!", `You and ${targetUser.firstName} liked each other.`);
            }
        } catch (error) {
            console.error('Swipe handle error:', error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: '#000' }]}>
                <ActivityIndicator size="large" color={BRAND_COLORS.blue} />
                <Text style={styles.loadingText}>Finding people for {title}...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <Text style={styles.headerSub}>{profiles.length} people nearby</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            {profiles.length > 0 ? (
                <View style={styles.swiperContainer}>
                    <Swiper
                        ref={swiperRef}
                        cards={profiles}
                        renderCard={(card) => <SwipeCard card={card} />}
                        onSwipedLeft={(index) => onSwiped(index, 'dislike')}
                        onSwipedRight={(index) => onSwiped(index, 'like')}
                        onSwipedTop={(index) => onSwiped(index, 'superlike')}
                        disableBottomSwipe
                        backgroundColor="transparent"
                        cardVerticalMargin={20}
                        stackSize={3}
                        stackSeparation={15}
                        overlayLabels={{
                            left: { title: 'NOPE', style: { label: styles.overlayLabel, wrapper: styles.overlayWrapperLeft } },
                            right: { title: 'LIKE', style: { label: styles.overlayLabel, wrapper: styles.overlayWrapperRight } },
                            top: { title: 'SUPER', style: { label: styles.overlayLabel, wrapper: styles.overlayWrapperTop } }
                        }}
                    />
                </View>
            ) : (
                <View style={styles.center}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="search" size={60} color="rgba(255,255,255,0.1)" />
                    </View>
                    <Text style={styles.emptyTitle}>No one here yet</Text>
                    <Text style={styles.emptySub}>Be the first to join this category by selecting it at the top of the Explore page!</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.retryText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 60,
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    swiperContainer: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 20, fontWeight: '600' },
    emptyIcon: { marginBottom: 20 },
    emptyTitle: { color: 'white', fontSize: 22, fontWeight: '900', textAlign: 'center' },
    emptySub: { color: 'rgba(255,255,255,0.5)', fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22 },
    retryBtn: { marginTop: 30, backgroundColor: BRAND_COLORS.blue, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
    retryText: { color: 'white', fontWeight: '800' },
    overlayLabel: { fontSize: 32, fontWeight: '900', color: 'white' },
    overlayWrapperLeft: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -30 },
    overlayWrapperRight: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 30, marginLeft: 30 },
    overlayWrapperTop: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }
});

export default CategoryDiscoveryScreen;
