import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

const CATEGORIES = [
    { id: '1', title: 'SHORT-TERM FUN', count: '9k+', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800', fullWidth: true, color: 'rgba(255, 68, 88, 0.4)' },
    { id: '2', title: 'SERIOUS CONNECTIONS', count: '12k', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', color: 'rgba(128, 0, 0, 0.4)' },
    { id: '3', title: 'LONG-TERM', count: '15k', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', color: 'rgba(139, 0, 0, 0.4)' },
    { id: '4', title: 'COFFEE DATE', count: '8k', image: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=400', color: 'rgba(128, 0, 128, 0.4)' },
    { id: '5', title: 'FREE TONIGHT', count: '5k', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', color: 'rgba(212, 175, 55, 0.4)' },
];

const ExploreScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const { profile } = useAuth();

    const renderCard = (item) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.card, item.fullWidth && styles.fullWidthCard]}
            onPress={() => Alert.alert(item.title, `Curating the best matches for "${item.title}"...`)}
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* High-End Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('Profile')}
                    style={[styles.avatarWrap, { borderColor: colors.border }]}
                >
                    <Image
                        source={{ uri: profile?.photos?.[0] || 'https://picsum.photos/150' }}
                        style={styles.headerAvatar}
                    />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Explore</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.iconButton, { backgroundColor: colors.surface }]}
                    onPress={() => { }}
                >
                    <Ionicons name="search" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.introSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Goal-Driven Social</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Find people who share your vision.</Text>
                </View>

                <View style={styles.grid}>
                    {CATEGORIES.map(renderCard)}
                </View>

                <View style={styles.footerSection}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        All discoverable profiles are verified for safety.
                    </Text>
                </View>
            </ScrollView>
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
        padding: 2,
    },
    headerAvatar: { width: '100%', height: '100%', borderRadius: 20 },
    headerCenter: { alignItems: 'center' },
    brandText: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: -2 },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    iconButton: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: LAYOUT.TAB_BAR_HEIGHT + 40 },
    introSection: { padding: 25 },
    sectionTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    sectionSubtitle: { fontSize: 15, fontWeight: '500', marginTop: 5 },
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
        backgroundColor: COLORS.primary + '30',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 8,
    },
    exploreTagText: { color: COLORS.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    footerSection: { padding: 40, alignItems: 'center', gap: 15 },
    footerText: { textAlign: 'center', fontSize: 13, fontWeight: '500', lineHeight: 18, opacity: 0.8 }
});

export default ExploreScreen;
