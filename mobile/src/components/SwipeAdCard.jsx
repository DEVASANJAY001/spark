import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { adService } from '../services/adService';
import useAuth from '../hooks/useAuth';
import { WebView } from 'react-native-webview';

const SwipeAdCard = ({ ad }) => {
    const { user } = useAuth();
    const startTimeRef = useRef(Date.now());

    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = getYoutubeId(ad.image); // We use the image field for media URL

    useEffect(() => {
        if (user && ad) {
            adService.logImpression(ad.id, user.uid);
        }
        return () => {
            if (user && ad) {
                const duration = Date.now() - startTimeRef.current;
                adService.logEngagement(ad.id, user.uid, duration);
            }
        };
    }, []);

    const handlePress = () => {
        if (user && ad) {
            adService.logEngagement(ad.id, user.uid, 0);
        }
        if (ad.targetUrl) {
            Linking.openURL(ad.targetUrl);
        }
    };

    return (
        <View style={styles.card}>
            {youtubeId ? (
                <View style={styles.image}>
                    <WebView
                        style={{ flex: 1 }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        mediaPlaybackRequiresUserAction={false}
                        allowsInlineMediaPlayback={true}
                        source={{ 
                            uri: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&playsinline=1&rel=0&origin=http://localhost` 
                        }}
                    />
                </View>
            ) : (
                <Image source={{ uri: ad.image }} style={styles.image} resizeMode="cover" />
            )}
            
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.adBadge}>
                        <Text style={styles.adBadgeText}>SPONSORED</Text>
                    </View>
                    
                    <Text style={styles.title}>{ad.title || 'Discover Something New'}</Text>
                    <Text style={styles.description}>{ad.description || 'Tap to learn more about this special offer.'}</Text>
                    
                    <TouchableOpacity style={styles.actionBtn} onPress={handlePress}>
                        <LinearGradient
                            colors={['#FF3366', '#FF1493']}
                            style={styles.btnGradient}
                        >
                            <Text style={styles.btnText}>{ad.buttonText || 'Learn More'}</Text>
                            <Ionicons name="arrow-forward" size={18} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#111',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        justifyContent: 'flex-end',
        padding: 24,
    },
    content: {
        gap: 10,
    },
    adBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    adBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    title: {
        color: 'white',
        fontSize: 32,
        fontWeight: '900',
    },
    description: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 22,
        marginBottom: 10,
    },
    actionBtn: {
        borderRadius: 15,
        overflow: 'hidden',
    },
    btnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        gap: 10,
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
    }
});

export default SwipeAdCard;
