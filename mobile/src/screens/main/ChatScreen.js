import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator, Platform, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, LAYOUT } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import { LinearGradient } from 'expo-linear-gradient';
import AdBanner from '../../components/AdBanner';

import { userService } from '../../services/userService';
import { Alert } from 'react-native';

const ChatScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const { user, profile } = useAuth();
    const [newMatches, setNewMatches] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user) {
            const unsubscribeNew = chatService.getNewMatches(user.uid, (list) => {
                setNewMatches(list);
            });
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

    const handleChatPress = (match) => {
        // 1. Check if it's already an active conversation
        const isActive = conversations.some(c => c.id === match.id);
        if (isActive) {
            navigation.navigate('ChatDetail', { matchId: match.id, otherUser: match.otherUser, createdAt: match.createdAt });
            return;
        }

        // 2. Check limits for NEW conversations
        const limit = userService.getChatLimit(profile?.premiumTier);
        if (conversations.length >= limit) {
            Alert.alert(
                'Chat Limit Reached',
                `Your current plan allows for ${limit} active conversations. Upgrade to unlock more!`,
                [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('Subscriptions') }
                ]
            );
            return;
        }

        navigation.navigate('ChatDetail', { matchId: match.id, otherUser: match.otherUser, createdAt: match.createdAt });
    };

    const renderNewMatch = ({ item }) => (
        <TouchableOpacity
            style={styles.newMatchCard}
            onPress={() => handleChatPress(item)}
        >
            <View style={styles.newMatchAvatarWrap}>
                <Image 
                    source={{ uri: item.otherUser?.photos?.[0] || 'https://picsum.photos/100' }} 
                    style={[styles.newMatchImage, { backgroundColor: colors.surface }]} 
                />
                {item.otherUser?.isRecentlyActive && <View style={[styles.activeDot, { borderColor: colors.background }]} />}
            </View>
            <Text style={[styles.newMatchName, { color: colors.text }]} numberOfLines={1}>
                {item.otherUser?.firstName?.split(',')[0]}
            </Text>
        </TouchableOpacity>
    );

    const renderMessageRow = ({ item }) => {
        const lastMsgAt = item.lastMessageAt?.toDate ? item.lastMessageAt.toDate() : null;
        const timeStr = lastMsgAt ? lastMsgAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        return (
            <TouchableOpacity
                key={item.id}
                style={styles.messageRow}
                onPress={() => handleChatPress(item)}
            >
                <View style={styles.avatarContainer}>
                    <Image 
                        source={{ uri: item.otherUser?.photos?.[0] || 'https://picsum.photos/100' }} 
                        style={styles.avatar} 
                    />
                    {item.otherUser?.isRecentlyActive && <View style={styles.onlineDot} />}
                </View>
                
                <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                        <Text style={[styles.messageName, { color: colors.text }, item.unread && styles.unreadText]} numberOfLines={1}>
                            {item.otherUser?.firstName?.split(',')[0]}
                        </Text>
                        <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
                            {timeStr}
                        </Text>
                    </View>
                    <View style={styles.previewRow}>
                        <Text style={[styles.messagePreview, { color: item.unread ? colors.text : colors.textSecondary }, item.unread && { fontWeight: '700' }]} numberOfLines={1}>
                            {item.lastMessage}
                        </Text>
                        {item.unread && <View style={[styles.unreadBadge, { backgroundColor: COLORS.primary }]} />}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const searchLower = search.toLowerCase();
    const filteredMatches = newMatches.filter(m => !search || m.otherUser?.firstName?.toLowerCase().includes(searchLower));
    const allConversations = conversations.filter(c => !search || c.otherUser?.firstName?.toLowerCase().includes(searchLower));

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Minimalist Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('Profile')}
                    style={styles.headerAvatarContainer}
                >
                    <Image source={{ uri: profile?.photos?.[0] || 'https://picsum.photos/100' }} style={styles.headerAvatar} />
                    <View style={styles.avatarRing} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Premium Search */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
                    <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                    <TextInput
                        placeholder="Search your matches"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.searchInput, { color: colors.text }]}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Horizontal New Matches */}
                {filteredMatches.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>New Matches</Text>
                            <View style={[styles.countBadge, { backgroundColor: COLORS.primary }]}>
                                <Text style={styles.countText}>{filteredMatches.length}</Text>
                            </View>
                        </View>
                        <FlatList
                            data={filteredMatches}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={item => item.id}
                            renderItem={renderNewMatch}
                            contentContainerStyle={styles.newMatchesList}
                        />
                    </View>
                )}

                {/* Non-intrusive Highlighted Ad in Chats */}
                <View style={{ paddingHorizontal: 20 }}>
                    <AdBanner placement="chats_top" style={{ height: 120, borderRadius: 25 }} />
                </View>

                {/* Conversation List */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Conversations</Text>
                    </View>
                    {allConversations.length > 0 ? (
                        <View style={styles.conversationsList}>
                            {allConversations.map(conv => renderMessageRow({ item: conv }))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
                                <Ionicons name="chatbubble-ellipses-outline" size={50} color={colors.textSecondary} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Match with people and start the conversation!
                            </Text>
                            <TouchableOpacity 
                                style={[styles.startSwipingBtn, { backgroundColor: COLORS.primary }]}
                                onPress={() => navigation.navigate('Swipe')}
                            >
                                <Text style={styles.startSwipingText}>Start Swiping</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Removed Subscription Lock Overlay - Messaging is now Free */}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 70,
    },
    headerAvatarContainer: {
        position: 'relative',
        width: 42,
        height: 42,
    },
    headerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 14,
    },
    avatarRing: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        opacity: 0.5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 16,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    content: { flex: 1 },
    scrollContent: { paddingBottom: LAYOUT.TAB_BAR_HEIGHT + 40 },
    section: { marginTop: 10 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.2,
    },
    countBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    countText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '800',
    },
    newMatchesList: {
        paddingLeft: 20,
        paddingBottom: 20,
    },
    newMatchCard: {
        width: 90,
        alignItems: 'center',
        marginRight: 15,
    },
    newMatchAvatarWrap: {
        position: 'relative',
        marginBottom: 10,
    },
    newMatchImage: {
        width: 80,
        height: 80,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: 'rgba(255, 51, 102, 0.15)',
    },
    newMatchName: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    activeDot: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#00e882',
        borderWidth: 4,
    },
    conversationsList: {
        paddingHorizontal: 15,
        gap: 12,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30, // Fully round like Instagram
        backgroundColor: '#1a1a1a',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#00e882',
        borderWidth: 2,
        borderColor: '#000',
    },
    messageContent: {
        flex: 1,
        marginLeft: 15,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    messageName: {
        fontSize: 18,
        fontWeight: '800',
        flex: 1,
        marginRight: 10,
    },
    unreadText: {
        color: COLORS.primary,
    },
    messageTime: {
        fontSize: 12,
        fontWeight: '600',
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messagePreview: {
        fontSize: 15,
        flex: 1,
        marginRight: 10,
        fontWeight: '500',
    },
    unreadBadge: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    startSwipingBtn: {
        paddingHorizontal: 35,
        paddingVertical: 15,
        borderRadius: 20,
    },
    startSwipingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    lockCard: {
        width: '100%',
        padding: 30,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    lockIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    lockTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 10,
        textAlign: 'center',
    },
    lockText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
        fontWeight: '500',
    },
    upgradeBtn: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        marginBottom: 15,
    },
    upgradeBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
    },
    maybeLaterBtn: {
        paddingVertical: 10,
    },
    maybeLaterText: {
        fontSize: 15,
        fontWeight: '700',
    }
});

export default ChatScreen;