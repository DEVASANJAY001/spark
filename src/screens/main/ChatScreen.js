import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import Wordmark from '../../../assets/wordmark.png';

const ChatScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { user, profile } = useAuth();
    const [newMatches, setNewMatches] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user) {
            // New Matches Row
            const unsubscribeNew = chatService.getNewMatches(user.uid, (list) => {
                setNewMatches(list);
            });

            // Conversations List
            const unsubscribeConv = chatService.getConversations(user.uid, (list) => {
                setConversations(list);
                setLoading(false);
            });

            return () => {
                unsubscribeNew();
                unsubscribeConv();
            };
        }
    }, [user]);

    const renderNewMatch = ({ item }) => {
        if (item.isGoldUpsell) {
            return (
                <TouchableOpacity style={[styles.goldMatchCard, { borderColor: colors.gold, backgroundColor: colors.card }]} onPress={() => navigation.navigate('Likes')}>
                    <View style={[styles.goldCircle, { borderColor: colors.gold }]}>
                        <Text style={[styles.goldCircleText, { color: colors.gold }]}>25+</Text>
                    </View>
                    <View style={styles.goldMatchLabelContainer}>
                        <Ionicons name="heart" size={12} color={colors.gold} />
                        <Text style={[styles.goldMatchLabel, { color: colors.gold }]}>like</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                style={styles.newMatchCard}
                onPress={() => navigation.navigate('ChatDetail', { matchId: item.id, otherUser: item.otherUser, createdAt: item.createdAt })}
            >
                <Image source={{ uri: item.otherUser?.photos?.[0] || 'https://picsum.photos/100' }} style={[styles.newMatchImage, { backgroundColor: colors.surface }]} />
                <Text style={[styles.newMatchName, { color: colors.text }]}>{item.otherUser?.firstName}</Text>
                {item.otherUser?.isRecentlyActive && <View style={[styles.activeDot, { borderColor: colors.background }]} />}
            </TouchableOpacity>
        );
    };

    const renderMessageRow = ({ item }) => {
        if (item.isSystem) {
            return (
                <TouchableOpacity key={item.id} style={styles.messageRow}>
                    <View style={[styles.systemAvatar, { backgroundColor: colors.primary }]}>
                        <Ionicons name="flame" size={30} color="white" />
                    </View>
                    <View style={styles.messageContent}>
                        <View style={styles.messageHeader}>
                            <Text style={[styles.messageName, { color: colors.text }]}>Team Tinder</Text>
                            <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 5 }} />
                        </View>
                        <Text style={[styles.messagePreview, { color: colors.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        if (item.isGoldNotification) {
            return (
                <TouchableOpacity
                    key={item.id}
                    style={styles.messageRow}
                    onPress={() => navigation.navigate('Likes')}
                >
                    <Image source={{ uri: item.photo }} style={[styles.avatar, styles.blurredAvatar, { backgroundColor: colors.surface }]} blurRadius={20} />
                    <View style={styles.messageContent}>
                        <Text style={[styles.messageName, { color: colors.text }]}>{item.firstName}</Text>
                        <View style={styles.goldBadgeRow}>
                            <Text style={[styles.goldBadgeText, { color: colors.gold, borderColor: colors.gold, backgroundColor: colors.isDark ? '#2D2D1B' : '#FFFBE6' }]}>LIKED YOU</Text>
                        </View>
                        <Text style={[styles.goldPreview, { color: colors.gold }]}>Recently active, match now!</Text>
                    </View>
                    {item.isOnline && <View style={styles.onlineDot} />}
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                key={item.id}
                style={styles.messageRow}
                onPress={() => navigation.navigate('ChatDetail', { matchId: item.id, otherUser: item.otherUser, createdAt: item.createdAt })}
            >
                <Image source={{ uri: item.otherUser?.photos?.[0] || 'https://picsum.photos/100' }} style={[styles.avatar, { backgroundColor: colors.surface }]} />
                <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                        <Text style={[styles.messageName, { color: colors.text }, item.unread && styles.unreadText]}>
                            {item.otherUser?.firstName}
                        </Text>
                        <Text style={[styles.messageTime, { color: colors.textMuted }]}>
                            {item.lastMessageAt?.toDate ? item.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                    </View>
                    <Text style={[styles.messagePreview, { color: colors.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
                </View>
                {item.unread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                {item.otherUser?.isRecentlyActive && <View style={[styles.onlineDot, { borderColor: colors.background }]} />}
            </TouchableOpacity>
        );
    };

    const searchLower = search.toLowerCase();
    const newMatchesWithUpsell = [
        { id: 'upsell', isGoldUpsell: true },
        ...newMatches.filter(m => !search || m.otherUser?.firstName?.toLowerCase().includes(searchLower))
    ];
    const allConversations = [
        ...(!search ? [{ id: 'system', isSystem: true, lastMessage: "Take a selfie and prove you're the person in your pics...", lastMessageAt: new Date() }] : []),
        ...(!search && profile?.premiumTier === 'free' ? [{ id: 'gold_noti', isGoldNotification: true, firstName: 'Barbara', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', isOnline: true }] : []),
        ...conversations.filter(c => !search || c.otherUser?.firstName?.toLowerCase().includes(searchLower))
    ];

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Image source={{ uri: profile?.photos?.[0] || 'https://picsum.photos/100' }} style={styles.headerAvatar} />
                </TouchableOpacity>
                <Image source={Wordmark} style={styles.logoStyle} tintColor={colors.primary} resizeMode="contain" />
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="shield-checkmark" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="chatbox-ellipses-outline" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                <Ionicons name="search" size={20} color={colors.primary} />
                <TextInput
                    placeholder={`Search ${newMatches.length + conversations.length} Matches`}
                    placeholderTextColor={colors.textMuted}
                    style={[styles.searchInput, { color: colors.text }]}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>New Matches</Text>
                </View>
                <FlatList
                    data={newMatchesWithUpsell}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.id}
                    renderItem={renderNewMatch}
                    contentContainerStyle={styles.newMatchesList}
                />

                <View style={[styles.sectionSeparator, { backgroundColor: colors.border }]} />

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Messages</Text>
                </View>
                {allConversations.map(conv => renderMessageRow({ item: conv }))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        height: 60,
    },
    headerAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#f0f0f0',
    },
    logoStyle: {
        width: 80,
        height: 30,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconBtn: {
        marginLeft: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        marginHorizontal: SPACING.m,
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginVertical: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: COLORS.dark,
    },
    content: {
        flex: 1,
    },
    sectionSeparator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: SPACING.m,
        marginTop: 5,
    },
    sectionHeader: {
        paddingHorizontal: SPACING.m,
        marginTop: 15,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    newMatchesList: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    newMatchCard: {
        width: 90,
        alignItems: 'center',
        marginRight: 10,
    },
    newMatchImage: {
        width: 80,
        height: 100,
        borderRadius: 10,
        backgroundColor: '#eee',
    },
    newMatchName: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    goldMatchCard: {
        width: 80,
        height: 100,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D4AF37',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        backgroundColor: '#fff',
    },
    goldCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#D4AF37',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
    },
    goldCircleText: {
        color: '#D4AF37',
        fontWeight: 'bold',
        fontSize: 14,
    },
    goldMatchLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    goldMatchLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#D4AF37',
        textTransform: 'uppercase',
        marginLeft: 2,
    },
    activeDot: {
        position: 'absolute',
        bottom: 25,
        left: 5,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#00e882',
        borderWidth: 2,
        borderColor: 'white',
    },
    messageRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.m,
        paddingVertical: 15,
        alignItems: 'center',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#eee',
    },
    blurredAvatar: {
        opacity: 0.8,
    },
    systemAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fd267d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContent: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messageName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    unreadText: {
        fontWeight: '900',
    },
    messageTime: {
        fontSize: 12,
        color: COLORS.grey,
    },
    messagePreview: {
        fontSize: 14,
        color: COLORS.grey,
        marginTop: 2,
    },
    onlineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#00e882',
        borderWidth: 2,
        borderColor: 'white',
        position: 'absolute',
        left: 70,
        bottom: 15,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginHorizontal: 10,
    },
    goldBadgeRow: {
        flexDirection: 'row',
        marginTop: 2,
    },
    goldBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#D4AF37',
        backgroundColor: '#fffbe6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#D4AF37',
    },
    goldPreview: {
        fontSize: 14,
        color: '#D4AF37',
        fontStyle: 'italic',
        marginTop: 2,
    }
});

export default ChatScreen;