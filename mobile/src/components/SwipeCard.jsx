import React from 'react';
import { StyleSheet, View, Text, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SwipeCard = ({ profile }) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);

    if (!profile) return null;

    const photos = profile.photos?.filter(p => p) || [];
    const hasPhotos = photos.length > 0;
    const currentPhoto = hasPhotos
        ? photos[currentPhotoIndex]
        : 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=1200';

    const nextPhoto = () => {
        if (currentPhotoIndex < photos.length - 1) {
            setCurrentPhotoIndex(currentPhotoIndex + 1);
        }
    };

    const prevPhoto = () => {
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(currentPhotoIndex - 1);
        }
    };

    return (
        <View style={styles.card}>
            <Image
                source={{ uri: currentPhoto }}
                style={styles.image}
            />

            {/* Tap areas for photo navigation */}
            <View style={styles.navigationOverlay}>
                <TouchableOpacity 
                    style={styles.navTapArea} 
                    onPress={(e) => {
                        e.stopPropagation();
                        prevPhoto();
                    }} 
                    activeOpacity={1} 
                />
                <TouchableOpacity 
                    style={styles.navTapArea} 
                    onPress={(e) => {
                        e.stopPropagation();
                        nextPhoto();
                    }} 
                    activeOpacity={1} 
                />
            </View>

            {/* Photo Indicators */}
            {photos.length > 1 && (
                <View style={styles.indicators}>
                    {photos.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.indicator,
                                { flex: 1 },
                                i === currentPhotoIndex ? styles.activeIndicator : styles.inactiveIndicator
                            ]}
                        />
                    ))}
                </View>
            )}

            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                style={styles.gradient}
            />

            <View style={styles.cardInfo}>
                <View style={styles.badgeRow}>
                    <View style={styles.nearbyBadge}>
                        <Ionicons name="location" size={12} color="white" />
                        <Text style={styles.badgeText}>Nearby</Text>
                    </View>
                    {profile.isRecentlyActive && (
                        <View style={styles.activeBadge}>
                            <View style={styles.activeDot} />
                            <Text style={styles.badgeText}>Recently Active</Text>
                        </View>
                    )}
                </View>

                <View style={styles.nameRow}>
                    <Text style={styles.name}>{profile.firstName}, {profile.age || '21'}</Text>
                    {profile.isVerified && (
                        <Ionicons name="checkmark-circle" size={22} color="#00e882" style={{ marginLeft: 6 }} />
                    )}
                </View>

                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="pin" size={14} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.detailText}>1 mile away</Text>
                    </View>
                </View>

                {profile.bio && (
                    <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: width * 0.95,
        height: height * 0.72,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#111',
        alignSelf: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    navigationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 120,
        flexDirection: 'row',
    },
    navTapArea: {
        flex: 1,
    },
    indicators: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        height: 3,
        zIndex: 10,
    },
    indicator: {
        height: '100%',
        marginHorizontal: 2,
        borderRadius: 2,
    },
    activeIndicator: {
        backgroundColor: 'white',
    },
    inactiveIndicator: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    cardInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    nearbyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#00e882',
        marginRight: 6,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    name: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5,
    },
    detailsRow: {
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
    },
    bio: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 22,
    }
});

export default SwipeCard;
