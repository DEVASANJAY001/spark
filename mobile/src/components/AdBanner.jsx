import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, Animated, Linking } from 'react-native';
import { adService } from '../services/adService';
import useAuth from '../hooks/useAuth';
import { COLORS } from '../constants/theme';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const AdBanner = ({ placement, style }) => {
    const { user, profile } = useAuth();
    const [ads, setAds] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const startTimeRef = useRef(Date.now());
    const videoRef = useRef(null);

    useEffect(() => {
        const fetchAds = async () => {
            const fetchedAds = await adService.getAdsByPlacement(
                placement, 
                profile?.location, 
                profile?.city, 
                profile
            );
            setAds(fetchedAds);
        };
        fetchAds();
    }, [placement, profile]);

    // Auto-loop logic with cross-fade
    useEffect(() => {
        if (ads.length <= 1) return;

        const interval = setInterval(() => {
            Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
                setCurrentIndex((prev) => (prev + 1) % ads.length);
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
            });
        }, 6000); 

        return () => clearInterval(interval);
    }, [ads]);

    // Log analytics
    useEffect(() => {
        if (ads[currentIndex] && user) {
            adService.logImpression(ads[currentIndex].id, user.uid);
            const duration = Date.now() - startTimeRef.current;
            if (ads[currentIndex - 1 >= 0 ? currentIndex - 1 : ads.length - 1]) {
                const prevAd = ads[currentIndex - 1 >= 0 ? currentIndex - 1 : ads.length - 1];
                adService.logEngagement(prevAd.id, user.uid, duration);
            }
            startTimeRef.current = Date.now();
        }
    }, [currentIndex, ads, user]);

    const handlePress = (ad) => {
        if (user) adService.logEngagement(ad.id, user.uid, 0);
        if (ad.targetUrl) Linking.openURL(ad.targetUrl);
    };

    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (ads.length === 0) return null;

    const currentAd = ads[currentIndex];
    const youtubeId = getYoutubeId(currentAd.image);
    const isVideo = currentAd.mediaType === 'video' || currentAd.image?.endsWith('.mp4');

    return (
        <Animated.View style={[
            styles.container, 
            currentAd.highlighted && styles.highlightedContainer,
            { opacity: fadeAnim },
            style
        ]}>
            <TouchableOpacity 
                activeOpacity={0.95} 
                onPress={() => handlePress(currentAd)}
                style={styles.adWrapper}
            >
                {/* Media Layer */}
                <View style={styles.mediaContainer}>
                    {youtubeId ? (
                        <WebView
                            style={styles.adMedia}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            scrollEnabled={false}
                            pointerEvents="none"
                            mediaPlaybackRequiresUserAction={false}
                            allowsInlineMediaPlayback={true}
                            source={{ 
                                uri: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&playsinline=1&rel=0&origin=http://localhost` 
                            }}
                        />
                    ) : isVideo ? (
                        <Video
                            ref={videoRef}
                            source={{ uri: currentAd.image }}
                            style={styles.adMedia}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay
                            isLooping
                            isMuted
                        />
                    ) : (
                        <Image 
                            source={{ uri: currentAd.image }} 
                            style={styles.adMedia} 
                            resizeMode="cover"
                        />
                    )}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                        style={styles.overlayGradient}
                    />
                </View>
                
                {/* Brand & Badge Layer */}
                <View style={styles.topRow}>
                    <View style={styles.sponsoredBadge}>
                        <Ionicons name="megaphone" size={10} color="white" style={{marginRight: 4}} />
                        <Text style={styles.sponsoredText}>SPONSORED</Text>
                    </View>
                    {currentAd.highlighted && (
                        <View style={styles.premiumBadge}>
                            <Ionicons name="sparkles" size={10} color="white" />
                        </View>
                    )}
                </View>

                {/* Info & CTA Layer */}
                <View style={styles.contentFooter}>
                    <View style={styles.textColumn}>
                        {currentAd.title && <Text style={styles.adTitle} numberOfLines={1}>{currentAd.title}</Text>}
                        {currentAd.description && <Text style={styles.adDesc} numberOfLines={1}>{currentAd.description}</Text>}
                    </View>
                    
                    <View style={styles.ctaButton}>
                        <Text style={styles.ctaText}>{currentAd.buttonText || 'Open'}</Text>
                        <Ionicons name="arrow-forward" size={14} color="white" />
                    </View>
                </View>
                
                {/* Elegant Progress Line */}
                {ads.length > 1 && (
                    <View style={styles.progressBarBg}>
                        <Animated.View 
                            style={[
                                styles.progressBarFill, 
                                { width: ((currentIndex + 1) / ads.length) * 100 + '%' }
                            ]} 
                        />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 120,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#000',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    highlightedContainer: {
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
    },
    adWrapper: {
        width: '100%',
        height: '100%',
    },
    mediaContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    adMedia: {
        width: '100%',
        height: '100%',
    },
    overlayGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        alignItems: 'center',
    },
    sponsoredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sponsoredText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    premiumBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowRadius: 5,
        shadowOpacity: 0.5,
    },
    contentFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textColumn: {
        flex: 1,
        marginRight: 15,
    },
    adTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: -0.2,
    },
    adDesc: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    ctaText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
    },
    progressBarBg: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
    }
});

export default AdBanner;
