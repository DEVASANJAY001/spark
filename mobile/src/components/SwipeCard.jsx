import React from 'react';
import { StyleSheet, View, Text, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { userService } from '../services/userService';

const { width, height } = Dimensions.get('window');

const SwipeCard = ({ profile, currentUserLocation }) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);

    const distance = React.useMemo(() => {
        if (profile?.distance != null) return profile.distance;
        if (!currentUserLocation || !profile?.location) return null;
        return userService.calculateDistance(
            currentUserLocation.latitude,
            currentUserLocation.longitude,
            profile.location.latitude,
            profile.location.longitude
        );
    }, [currentUserLocation, profile?.location, profile?.distance]);

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

            {/* Photo Navigation Overlays */}
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

            {/* Photo Indicators - Modern Segmented Style */}
            {photos.length > 1 && (
                <View style={styles.indicatorContainer}>
                    {photos.map((_, i) => (
                        <View key={i} style={styles.indicatorTrack}>
                            <View
                                style={[
                                    styles.indicatorFill,
                                    { width: i === currentPhotoIndex ? '100%' : '0%', opacity: i < currentPhotoIndex ? 0.4 : 1 }
                                ]}
                            />
                        </View>
                    ))}
                </View>
            )}

            {/* High-End Shadow Gradient */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', '#000000']}
                locations={[0, 0.4, 0.8, 1]}
                style={styles.gradient}
            />

            <View style={styles.cardInfo}>
                {/* Status Badges */}
                <View style={styles.badgeRow}>
                    <View style={styles.glassBadge}>
                        <Ionicons name="location-sharp" size={12} color="white" />
                        <Text style={styles.badgeText}>
                            {distance !== null ? `${parseFloat(distance).toFixed(1)} KM` : profile?.location?.city || 'Nearby'}
                        </Text>
                    </View>
                    {profile.isRecentlyActive && (
                        <View style={[styles.glassBadge, styles.activeBadge]}>
                            <View style={styles.activeDot} />
                            <Text style={styles.badgeText}>Online</Text>
                        </View>
                    )}
                </View>

                {/* Primary Info */}
                <View style={styles.mainInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>
                            {profile.firstName}{(!profile.firstName?.includes(profile.age?.toString()) && profile.age) ? `, ${profile.age}` : ''}
                        </Text>
                        {profile.isVerified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-sharp" size={14} color="white" />
                            </View>
                        )}
                    </View>
                    
                    {profile.job && (
                        <View style={styles.jobRow}>
                            <Ionicons name="briefcase-outline" size={14} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.jobText}>{profile.job}</Text>
                        </View>
                    )}

                    {profile.bio && (
                        <Text style={styles.bio} numberOfLines={2}>
                            {profile.bio}
                        </Text>
                    )}

                    {/* Location / Distance Row */}
                    {(distance !== null || profile.city) && (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={14} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.locationText}>
                                {distance !== null ? `${Math.round(distance)} km away` : profile.city}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradient: {
        position: 'absolute',
        bottom: -2, // Slight bleed to ensure full coverage
        left: 0,
        right: 0,
        height: '75%',
    },
    navigationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 100,
        flexDirection: 'row',
        zIndex: 5,
    },
    navTapArea: {
        flex: 1,
    },
    indicatorContainer: {
        position: 'absolute',
        top: 15,
        left: 15,
        right: 15,
        flexDirection: 'row',
        gap: 6,
        zIndex: 20,
    },
    indicatorTrack: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    indicatorFill: {
        height: '100%',
        backgroundColor: 'white',
    },
    cardInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 25,
        zIndex: 10,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 15,
    },
    glassBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    activeBadge: {
        backgroundColor: 'rgba(0, 255, 136, 0.15)',
        borderColor: 'rgba(0, 255, 136, 0.3)',
    },
    activeDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#00FF88',
        marginRight: 6,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    mainInfo: {
        gap: 5,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 34,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5,
    },
    age: {
        fontSize: 28,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.9)',
    },
    verifiedBadge: {
        backgroundColor: COLORS.primary,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        borderWidth: 1.5,
        borderColor: 'white',
    },
    jobRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    jobText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 15,
        fontWeight: '600',
    },
    bio: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 22,
        marginTop: 8,
        fontWeight: '500',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    locationText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
    }
});

export default SwipeCard;
