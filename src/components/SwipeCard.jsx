import React from 'react';
import { StyleSheet, View, Text, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
                <TouchableOpacity style={styles.navTapArea} onPress={prevPhoto} activeOpacity={1} />
                <TouchableOpacity style={styles.navTapArea} onPress={nextPhoto} activeOpacity={1} />
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
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.gradient}
            />

            <View style={styles.topBadges}>
                <View style={styles.nearbyBadge}>
                    <Ionicons name="location" size={12} color="white" />
                    <Text style={styles.nearbyText}>Nearby</Text>
                </View>
                {profile.recentlyActive && (
                    <View style={styles.activeBadge}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeText}>Recently Active</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity style={styles.scrollButton}>
                <Ionicons name="arrow-up" size={18} color="white" />
            </TouchableOpacity>

            <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                    <Text style={styles.name}>{profile.firstName}, {profile.age || '25'}</Text>
                    {profile.isVerified && (
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.blue} style={{ marginLeft: 8 }} />
                    )}
                </View>

                <View style={styles.distanceRow}>
                    <Ionicons name="pin" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.distance}>1 mile away</Text>
                </View>

                {profile.bio && (
                    <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
                )}

                {profile.lookingFor && (
                    <View style={styles.goalRow}>
                        <Ionicons name="search" size={14} color={COLORS.primary} />
                        <Text style={styles.goalText}>{profile.lookingFor}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: width * 0.92,
        height: width * 1.35,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        alignSelf: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 15px 30px rgba(0,0,0,0.4)',
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 15 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
                elevation: 10,
            }
        })
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
        height: '50%',
    },
    navigationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 150, // Leave space for info
        flexDirection: 'row',
    },
    navTapArea: {
        flex: 1,
    },
    indicators: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
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
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    topBadges: {
        position: 'absolute',
        top: 15,
        left: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    nearbyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,180,0,0.85)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
    },
    nearbyText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
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
        fontSize: 12,
        fontWeight: 'bold',
    },
    scrollButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        ...Platform.select({
            web: { textShadow: '0px 2px 4px rgba(0,0,0,0.3)' },
            default: {
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
            }
        })
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    distance: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginLeft: 6,
    },
    bio: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 20,
        marginBottom: 12,
    },
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    goalText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    }
});

export default SwipeCard;
