import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, LAYOUT, BRAND_COLORS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import AdBanner from '../../components/AdBanner';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

const CATEGORIES = [
    { id: 'SHORT-TERM FUN', title: 'SHORT-TERM FUN', count: '9k+', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800', fullWidth: true, color: '#FF4458' },
    { id: 'SERIOUS CONNECTIONS', title: 'SERIOUS CONNECTIONS', count: '12k', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', color: '#8B0000' },
    { id: 'LONG-TERM', title: 'LONG-TERM', count: '15k', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', color: '#800000' },
    { id: 'COFFEE DATE', title: 'COFFEE DATE', count: '8k', image: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=400', color: '#800080' },
    { id: 'FREE TONIGHT', title: 'FREE TONIGHT', count: '5k', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', color: '#D4AF37' },
];

const ExploreScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { user, profile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedCatName, setSelectedCatName] = useState('');

    const handleSelectCategory = async (catId) => {
        if (!user) return;
        setSaving(true);
        try {
            await userService.saveProfile(user.uid, { selectedCategory: catId });
            setSelectedCatName(catId);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Category update failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const renderCard = (item) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.card, item.fullWidth && styles.fullWidthCard]}
            onPress={() => navigation.navigate('CategoryDiscovery', { category: item.id, title: item.title })}
            activeOpacity={0.9}
        >
            <ImageBackground source={{ uri: item.image }} style={styles.image}>
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradient}
                />

                <View style={styles.badge}>
                    <Ionicons name="flash" size={10} color="white" />
                    <Text style={styles.badgeText}>{item.count} ACTIVE</Text>
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={styles.exploreTag}>
                        <Text style={styles.exploreTagText}>EXPLORE</Text>
                    </View>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('Profile')}
                    style={styles.avatarWrap}
                >
                    <Image
                        source={{ uri: profile?.photos?.[0] || 'https://picsum.photos/150' }}
                        style={styles.headerAvatar}
                    />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Explore</Text>
                </View>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="search" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* SET YOUR CATEGORY SECTION */}
                <View style={styles.selectionSection}>
                    <LinearGradient
                        colors={[BRAND_COLORS.blue + '20', '#000']}
                        style={styles.selectionCard}
                    >
                        <Text style={styles.selectionTitle}>Be seen by more people!</Text>
                        <Text style={styles.selectionSubtitle}>Select a category to feature your profile and find like-minded matches.</Text>
                        
                        <View style={styles.scrollWrapper}>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false} 
                                contentContainerStyle={styles.categoryScroll}
                                decelerationRate="fast"
                            >
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity 
                                        key={cat.id}
                                        style={[
                                            styles.catBtn, 
                                            { borderColor: profile?.selectedCategory === cat.id ? BRAND_COLORS.blue : 'rgba(255,255,255,0.1)' },
                                            profile?.selectedCategory === cat.id && { backgroundColor: BRAND_COLORS.blue + '20' }
                                        ]}
                                        onPress={() => handleSelectCategory(cat.id)}
                                        disabled={saving}
                                    >
                                        {saving && profile?.selectedCategory === cat.id ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Text style={[
                                                styles.catBtnText,
                                                profile?.selectedCategory === cat.id && { color: BRAND_COLORS.blue, fontWeight: '800' }
                                            ]}>
                                                {cat.title}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Optical Edge Gradients */}
                            <LinearGradient
                                colors={['#000', 'transparent']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={[styles.edgeGradient, { left: 0 }]}
                                pointerEvents="none"
                            />
                            <LinearGradient
                                colors={['transparent', '#000']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={[styles.edgeGradient, { right: 0 }]}
                                pointerEvents="none"
                            />
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.introSection}>
                    <Text style={styles.sectionTitle}>Discovery Modes</Text>
                    <Text style={styles.sectionSubtitle}>Find people who share your current vibe.</Text>
                </View>

                {/* Explore Grid Ad */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <AdBanner placement="explore_grid" style={{ height: 120, borderRadius: 25 }} />
                </View>

                <View style={styles.grid}>
                    {CATEGORIES.map(renderCard)}
                </View>

                <View style={styles.footerSection}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={BRAND_COLORS.blue} />
                    <Text style={styles.footerText}>
                        All discoverable profiles are verified for safety.
                    </Text>
                </View>
            </ScrollView>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <LinearGradient
                            colors={[BRAND_COLORS.blue, BRAND_COLORS.pink]}
                            style={styles.modalGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.iconCircle}>
                                <Ionicons name="flash" size={40} color="white" />
                            </View>
                            
                            <Text style={styles.modalTitle}>You're Featured!</Text>
                            <Text style={styles.modalSubtitle}>
                                Your profile is now being prioritized for people looking for:
                            </Text>
                            <View style={styles.catBadge}>
                                <Text style={styles.catBadgeText}>{selectedCatName}</Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.modalButton}
                                onPress={() => setShowSuccessModal(false)}
                            >
                                <Text style={styles.modalButtonText}>AWESOME</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 70,
    },
    avatarWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: BRAND_COLORS.blue,
        padding: 2,
    },
    headerAvatar: { width: '100%', height: '100%', borderRadius: 20 },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
    iconButton: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    content: { paddingBottom: LAYOUT.TAB_BAR_HEIGHT + 40 },
    selectionSection: { paddingHorizontal: 20, marginTop: 10 },
    selectionCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    selectionTitle: { color: 'white', fontSize: 18, fontWeight: '900', marginBottom: 8 },
    selectionSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18, marginBottom: 20 },
    scrollWrapper: { position: 'relative' },
    categoryScroll: { paddingHorizontal: 20, gap: 10 },
    edgeGradient: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 10,
    },
    catBtn: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    catBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
    introSection: { padding: 25 },
    sectionTitle: { fontSize: 24, fontWeight: '900', color: 'white' },
    sectionSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 5 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    card: {
        width: COLUMN_WIDTH,
        height: 220,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
    },
    fullWidthCard: { width: '100%', height: 240 },
    image: { width: '100%', height: '100%' },
    gradient: { ...StyleSheet.absoluteFillObject },
    badge: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    badgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
    cardInfo: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    cardTitle: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
    exploreTag: {
        alignSelf: 'flex-start',
        backgroundColor: BRAND_COLORS.blue + '30',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 8,
    },
    exploreTagText: { color: BRAND_COLORS.blue, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    footerSection: { padding: 40, alignItems: 'center', gap: 15 },
    footerText: { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    modalContent: { width: '100%', borderRadius: 32, overflow: 'hidden', elevation: 20 },
    modalGradient: { padding: 30, alignItems: 'center' },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: 'white', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    modalSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    catBadge: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, marginBottom: 30 },
    catBadgeText: { color: BRAND_COLORS.blue, fontSize: 16, fontWeight: '900' },
    modalButton: { backgroundColor: 'rgba(0,0,0,0.3)', width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    modalButtonText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 1 }
});

export default ExploreScreen;
