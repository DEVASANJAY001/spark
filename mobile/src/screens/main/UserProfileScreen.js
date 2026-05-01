import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { userService } from '../../services/userService';
import { COLORS, BRAND_COLORS, LAYOUT } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const UserProfileScreen = ({ route, navigation }) => {
    const { userId } = route.params;
    const { colors } = useTheme();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            const fetchProfile = async () => {
                try {
                    const data = await userService.getProfile(userId);
                    setProfile(data);
                } catch (error) {
                    console.error('Fetch profile error:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }
    }, [userId]);

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: '#000' }]}>
                <ActivityIndicator size="large" color={BRAND_COLORS.blue} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: '#000' }]}>
                <Text style={{ color: 'white' }}>Profile not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ color: BRAND_COLORS.blue, marginTop: 10 }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const photos = profile.photos?.filter(p => p) || [];

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Photo */}
                <View style={styles.heroContainer}>
                    <Image 
                        source={{ uri: photos[0] || 'https://picsum.photos/800' }} 
                        style={styles.heroImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.9)'] }
                        style={StyleSheet.absoluteFill}
                    />
                    
                    {/* Header Overlay */}
                    <SafeAreaView style={styles.headerOverlay}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back" size={28} color="white" />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {/* Basic Info Overlay */}
                    <View style={styles.infoOverlay}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>{profile.firstName}</Text>
                            <Text style={styles.age}>, {profile.age || '21'}</Text>
                            {profile.isVerified && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark" size={14} color="white" />
                                </View>
                            )}
                        </View>
                        <View style={styles.statusRow}>
                            <Ionicons name="location-sharp" size={14} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.statusText}>{profile.location?.city || 'Nearby'}</Text>
                        </View>
                    </View>
                </View>

                {/* Details Section */}
                <View style={styles.detailsContainer}>
                    {/* Bio */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.bioText}>{profile.bio || "No bio yet."}</Text>
                    </View>

                    {/* Interests */}
                    {profile.interests && profile.interests.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Interests</Text>
                            <View style={styles.interestsGrid}>
                                {profile.interests.map((interest, index) => (
                                    <View key={index} style={styles.interestChip}>
                                        <Text style={styles.interestText}>{interest}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* More Photos */}
                    {photos.length > 1 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Photos</Text>
                            <View style={styles.photoGrid}>
                                {photos.slice(1).map((photo, index) => (
                                    <Image key={index} source={{ uri: photo }} style={styles.gridImage} />
                                ))}
                            </View>
                        </View>
                    )}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomActions}>
                <TouchableOpacity style={[styles.actionCircle, { borderColor: '#FF3366' }]}>
                    <Ionicons name="close" size={30} color="#FF3366" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.messageBtn, { backgroundColor: BRAND_COLORS.blue }]}>
                    <Ionicons name="chatbubble" size={24} color="white" />
                    <Text style={styles.messageBtnText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCircle, { borderColor: '#00FF88' }]}>
                    <Ionicons name="heart" size={30} color="#00FF88" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    heroContainer: {
        width: width,
        height: height * 0.6,
        position: 'relative',
    },
    heroImage: { width: '100%', height: '100%' },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 20,
        marginTop: 10,
    },
    infoOverlay: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: { fontSize: 36, fontWeight: '900', color: 'white' },
    age: { fontSize: 32, fontWeight: '400', color: 'rgba(255,255,255,0.9)' },
    verifiedBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: BRAND_COLORS.blue,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        gap: 5,
    },
    statusText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '500' },
    detailsContainer: {
        padding: 20,
    },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: 'white', marginBottom: 12 },
    bioText: { fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },
    interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    interestChip: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    interestText: { color: 'white', fontSize: 14, fontWeight: '600' },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridImage: {
        width: (width - 50) / 2,
        height: (width - 50) / 2,
        borderRadius: 15,
    },
    bottomActions: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        paddingHorizontal: 20,
    },
    actionCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageBtn: {
        flex: 1,
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: BRAND_COLORS.blue,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    messageBtnText: { color: 'white', fontSize: 18, fontWeight: '800' }
});

export default UserProfileScreen;
