import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const [profile, setProfile] = useState(null);
    const [premiumFeatures, setPremiumFeatures] = useState([]);

    useEffect(() => {
        if (user) {
            const unsubscribe = userService.subscribeToProfile(user.uid, (data) => {
                setProfile(data);
            });
            return () => unsubscribe();
        }
    }, [user]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'plans'));
                const carouselItems = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPremiumFeatures(carouselItems);
            } catch (error) {
                console.error('Error fetching plans for profile:', error);
            }
        };
        fetchPlans();
    }, []);

    const calculateAge = (birthday) => {
        if (!birthday) return null;
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'Check out Spark - Find your perfect match!',
                url: 'https://sparkapp.com'
            });
        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Modern Header with Logo */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
                        <Ionicons name="settings-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Profile Hero Section */}
                <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.photoStack}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.photoContainer}
                        >
                            {(profile?.photos || []).filter(p => p).map((photo, index) => (
                                <Image key={index} source={{ uri: photo }} style={styles.photoPill} />
                            ))}
                            {(!profile?.photos || profile.photos.filter(p => p).length === 0) && (
                                <View style={[styles.photoPill, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="camera" size={32} color={colors.textSecondary} />
                                </View>
                            )}
                        </ScrollView>
                    </View>

                    <View style={styles.profileMainInfo}>
                        <Text style={[styles.profileName, { color: colors.text }]}>
                            {profile?.firstName}, {profile?.age || calculateAge(profile?.birthday) || '21'}
                        </Text>
                        <Text style={[styles.profileBio, { color: colors.textSecondary }]} numberOfLines={2}>
                            {profile?.bio || 'Add a bio to tell people more about you...'}
                        </Text>

                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#FF1493']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.editGradient}
                            >
                                <Ionicons name="pencil" size={16} color="white" />
                                <Text style={styles.editButtonText}>Edit Profile</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Subscription Card */}
                <View style={[styles.subscriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.subHeaderRow}>
                        <Ionicons name="ribbon" size={24} color={profile?.hasPremium ? COLORS.primary : colors.textSecondary} />
                        <View style={styles.subInfo}>
                            <Text style={[styles.subTitle, { color: colors.text }]}>
                                {profile?.hasPremium ? `Spark ${profile.premiumTier?.toUpperCase() || 'PLUS'}` : 'Free Plan'}
                            </Text>
                            <Text style={[styles.subStatus, { color: profile?.hasPremium ? '#4CAF50' : colors.textSecondary }]}>
                                {profile?.hasPremium ? 'Active' : 'No Active Subscription'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={[styles.upgradeBtn, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.navigate('Subscription')}
                    >
                        <Text style={[styles.upgradeText, { color: COLORS.primary }]}>
                            {profile?.hasPremium ? 'Manage Plan' : 'Upgrade Now'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Transactions Link */}
                <TouchableOpacity 
                    style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Transactions')}
                >
                    <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="receipt" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.actionDetails}>
                        <Text style={[styles.actionTitle, { color: colors.text }]}>Transactions</Text>
                        <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>History and Redemptions</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Actions Grid */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.card }]} onPress={handleShare}>
                        <Ionicons name="share-social" size={24} color={colors.text} />
                        <Text style={[styles.gridLabel, { color: colors.text }]}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.card }]} onPress={() => Alert.alert('Coming Soon')}>
                        <Ionicons name="shield-checkmark" size={24} color={colors.text} />
                        <Text style={[styles.gridLabel, { color: colors.text }]}>Safety</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: SPACING.m },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    appLogo: {
        width: 32,
        height: 32,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    settingsBtn: {
        padding: 5,
    },
    heroCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    photoStack: {
        marginBottom: 20,
    },
    photoContainer: {
        gap: 12,
    },
    photoPill: {
        width: 120,
        height: 160,
        borderRadius: 16,
    },
    profileMainInfo: {
        alignItems: 'center',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    profileBio: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    editButton: {
        width: '100%',
        borderRadius: 30,
        overflow: 'hidden',
    },
    editGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    editButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    subscriptionCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subStatus: {
        fontSize: 12,
        marginTop: 2,
    },
    upgradeBtn: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 12,
    },
    upgradeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 15,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    actionDetails: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    actionSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 15,
    },
    gridItem: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        gap: 10,
    },
    gridLabel: {
        fontSize: 14,
        fontWeight: 'medium',
    }
});

export default ProfileScreen;