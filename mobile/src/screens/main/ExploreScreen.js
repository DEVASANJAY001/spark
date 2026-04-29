import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - SPACING.m * 3) / 2;

const CATEGORIES = [
    { id: '1', title: 'Short-term fun', count: '▲ 1', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800', fullWidth: true, color: 'rgba(255, 68, 88, 0.4)' },
    { id: '2', title: 'Serious Daters', count: '32', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', color: 'rgba(128, 0, 0, 0.4)' },
    { id: '3', title: 'Long-term partner', count: '92', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', color: 'rgba(139, 0, 0, 0.4)' },
    { id: '4', title: 'Coffee Date', count: '21', image: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=400', color: 'rgba(128, 0, 128, 0.4)' },
    { id: '5', title: 'Free Tonight', count: '82', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', color: 'rgba(212, 175, 55, 0.4)' },
];

const ExploreScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { profile } = useAuth();

    const renderCard = (item) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.card, item.fullWidth && styles.fullWidthCard]}
            onPress={() => Alert.alert(item.title, `Finding the best matches for "${item.title}" around you...`)}
        >
            <ImageBackground source={{ uri: item.image }} style={styles.image}>
                <LinearGradient
                    colors={['transparent', item.color, 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                />

                <View style={styles.badge}>
                    <Ionicons name="person" size={10} color="white" />
                    <Text style={styles.badgeText}>{item.count}</Text>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
            </ImageBackground>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Image
                        source={{ uri: profile?.photos?.[0] || 'https://picsum.photos/150' }}
                        style={[styles.headerAvatar, { backgroundColor: colors.surface }]}
                    />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Explore</Text>
                <TouchableOpacity onPress={() => { }}>
                    <Ionicons name="options-outline" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Goal-driven dating</Text>
                <Text style={styles.sectionSubtitle}>Find people with similar relationship goals</Text>

                <View style={styles.grid}>
                    {CATEGORIES.map(renderCard)}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#f0f0f0',
    },
    content: {
        paddingHorizontal: SPACING.m,
        paddingBottom: 40,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginVertical: SPACING.m,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.lightGrey,
        marginBottom: SPACING.m,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: COLUMN_WIDTH,
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: SPACING.m,
    },
    fullWidthCard: {
        width: '100%',
        height: 240,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    cardTitle: {
        position: 'absolute',
        bottom: 15,
        left: 15,
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        width: '80%',
    }
});

export default ExploreScreen;
