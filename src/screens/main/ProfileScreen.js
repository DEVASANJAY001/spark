import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform, Dimensions, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import UpgradeModal from '../../components/UpgradeModal';
import DeleteAccountModal from '../../components/DeleteAccountModal';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const { user, profile, deleteAccount } = useAuth();

    const [upgradeVisible, setUpgradeVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedTier, setSelectedTier] = useState('gold');

    const openUpgrade = (tier) => {
        setSelectedTier(tier);
        setUpgradeVisible(true);
    };

    const premiumFeatures = [
        { id: 'plus', title: 'Spark Plus®', button: 'Upgrade', color: ['#FF006E', '#FF4D94'], features: ['Unlimited Likes', 'Unlimited Rewind', 'Passport™'] },
        { id: 'gold', title: 'Spark GOLD', button: 'Upgrade', color: ['#D4AF37', '#FFD700'], features: ['See Who Likes You', 'Top Picks', 'Free Super Likes'] },
        { id: 'platinum', title: 'Spark PLATINUM', button: 'Upgrade', color: ['#757575', '#BDBDBD'], features: ['Priority Likes', 'Message before Matching'] },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <View style={styles.headerTop}>
                        <Image source={{ uri: (Array.isArray(profile?.photos) && profile.photos[0]) || 'https://picsum.photos/150' }} style={[styles.miniAvatar, { backgroundColor: colors.surface }]} />
                        <View style={styles.nameHeader}>
                            <Text style={[styles.headerName, { color: colors.text }]}>{profile?.firstName}</Text>
                            {!profile?.isProfileComplete && <Ionicons name="warning" size={16} color={colors.primary} />}
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                            <Ionicons name="settings-sharp" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.editPill, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <Ionicons name="pencil" size={18} color={colors.text} />
                        <Text style={[styles.editPillText, { color: colors.text }]}>Edit profile</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.completionSection, { backgroundColor: colors.card }]}>
                    <View style={[styles.progressBarContainer, { backgroundColor: colors.surface }]}>
                        <View style={[styles.progressBar, { width: `${profile?.profileCompletion || 10}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={[styles.completionText, { color: colors.textSecondary }]}>
                        {profile?.profileCompletion || 0}% Complete - <Text style={[styles.completionLink, { color: colors.primary }]}>Add more info!</Text>
                    </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Checklist</Text>

                {(!Array.isArray(profile?.photos) || profile.photos.filter(p => p).length < 4) && (
                    <TouchableOpacity
                        style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <View style={[styles.taskIcon, { backgroundColor: colors.surface }]}>
                            <Ionicons name="camera" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.taskInfo}>
                            <Text style={[styles.taskTitle, { color: colors.text }]}>Add at least 4 photos</Text>
                            <Text style={[styles.taskSubtitle, { color: colors.textSecondary }]}>
                                {Array.isArray(profile?.photos) ? profile.photos.filter(p => p).length : 0}/4 photos added. Get up to 2x more Likes with 6 pics.
                            </Text>
                        </View>
                        <View style={styles.boostBadge}>
                            <Text style={styles.boostBadgeText}>+28%</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {!profile?.isVerified && (
                    <TouchableOpacity
                        style={styles.taskCard}
                        onPress={() => Alert.alert("Verification", "Verification request submitted! We will review your profile shortly.")}
                    >
                        <View style={styles.taskIcon}>
                            <Ionicons name="shield-checkmark" size={24} color={COLORS.blue} />
                        </View>
                        <View style={styles.taskInfo}>
                            <Text style={styles.taskTitle}>Get verified</Text>
                            <Text style={styles.taskSubtitle}>Verify your profile to build trust with others.</Text>
                        </View>
                        <View style={styles.boostBadge}>
                            <Text style={styles.boostBadgeText}>+8%</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {Array.isArray(profile?.photos) && profile.photos.filter(p => p).length >= 4 && profile?.isVerified && (
                    <View style={styles.allDoneCard}>
                        <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                        <Text style={styles.allDoneText}>Your profile is looking great!</Text>
                    </View>
                )}

                <View style={styles.actionCardsRow}>
                    <View style={[styles.actionMiniCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                        <Ionicons name="star" size={20} color="#D4AF37" />
                        <Text style={[styles.actionCardCount, { color: colors.text }]}>{profile?.superLikes || 0} Super Likes</Text>
                        <Text style={[styles.actionCardLink, { color: colors.textSecondary }]}>GET MORE</Text>
                    </View>
                    <View style={[styles.actionMiniCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                        <Ionicons name="flash" size={20} color="#a15df9" />
                        <Text style={[styles.actionCardCount, { color: colors.text }]}>My Boosts</Text>
                        <Text style={[styles.actionCardLink, { color: colors.textSecondary }]}>GET MORE</Text>
                    </View>
                </View>

                <FlatList
                    data={premiumFeatures}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.premiumSlide}>
                            <LinearGradient colors={item.color} style={styles.premiumSlideGradient}>
                                <View style={styles.premiumHeaderRow}>
                                    <Text style={styles.premiumSlideTitle}>{item.title}</Text>
                                    <TouchableOpacity
                                        style={styles.premiumUpgradeBtn}
                                        onPress={() => openUpgrade(item.id)}
                                    >
                                        <Text style={[styles.premiumUpgradeText, { color: item.color[0] }]}>{item.button}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.featureList}>
                                    {item.features.map((f, i) => (
                                        <View key={i} style={styles.featureRow}>
                                            <Ionicons name="checkmark" size={16} color="white" />
                                            <Text style={styles.featureText}>{f}</Text>
                                        </View>
                                    ))}
                                </View>
                            </LinearGradient>
                        </View>
                    )}
                />

                {/* Delete Account Button Removed per User Request */}
            </ScrollView>

            <UpgradeModal
                visible={upgradeVisible}
                onClose={() => setUpgradeVisible(false)}
                tier={selectedTier}
            />

            {/* DeleteAccountModal Removed */}
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    content: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    header: {
        padding: SPACING.m,
        alignItems: 'center',
    },
    headerTop: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    miniAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    nameHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 5,
    },
    editPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: 'white',
    },
    editPillText: {
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 14,
    },
    completionSection: {
        paddingHorizontal: SPACING.m,
        marginBottom: 20,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 3,
        width: '100%',
        marginBottom: 10,
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    completionText: {
        fontSize: 12,
        color: COLORS.lightGrey,
        textAlign: 'center',
    },
    completionLink: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: SPACING.m,
        marginTop: 20,
        marginBottom: 10,
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        marginHorizontal: SPACING.m,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    taskIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    taskSubtitle: {
        fontSize: 12,
        color: COLORS.lightGrey,
        marginTop: 2,
    },
    boostBadge: {
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    boostBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    actionCardsRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.m,
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
    },
    actionMiniCard: {
        width: (width - SPACING.m * 3) / 2,
        backgroundColor: COLORS.dark,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionCardCount: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        marginTop: 5,
    },
    actionCardLink: {
        color: COLORS.lightGrey,
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 5,
    },
    premiumSlide: {
        width: width,
        paddingHorizontal: SPACING.m,
    },
    premiumSlideGradient: {
        borderRadius: 15,
        padding: 20,
        minHeight: 180,
    },
    premiumHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    premiumSlideTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    premiumUpgradeBtn: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
    },
    premiumUpgradeText: {
        color: COLORS.dark,
        fontWeight: 'bold',
        fontSize: 12,
    },
    featureList: {
        marginTop: 10,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    featureText: {
        color: 'white',
        fontSize: 13,
        marginLeft: 10,
    },
    deleteAccountBtn: {
        marginTop: 40,
        marginBottom: 20,
        alignItems: 'center',
        padding: 15,
    },
    deleteAccountTxt: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    allDoneCard: {
        backgroundColor: '#E8F5E9',
        marginHorizontal: SPACING.m,
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    allDoneText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginTop: 15,
        textAlign: 'center',
    }
});

export default ProfileScreen;