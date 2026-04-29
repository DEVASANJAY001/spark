import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import Wordmark from '../../../assets/wordmark.jpg';

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
    const filteredMatches = newMatches.filter(m => !search || m.otherUser?.firstName?.toLowerCase().includes(searchLower));
    const allConversations = conversations.filter(c => !search || c.otherUser?.firstName?.toLowerCase().includes(searchLower));

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Image source={{ uri: profile?.photos?.[0] || 'https://picsum.photos/100' }} style={styles.headerAvatar} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" />
                <TextInput
                    placeholder="Search matches"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {filteredMatches.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>New Matches</Text>
                        </View>
                        <FlatList
                            data={filteredMatches}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={item => item.id}
                            renderItem={renderNewMatch}
                            contentContainerStyle={styles.newMatchesList}
                        />
                    </>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Messages</Text>
                </View>
                {allConversations.length > 0 ? (
                    allConversations.map(conv => renderMessageRow({ item: conv }))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={60} color="rgba(255,255,255,0.1)" />
                        <Text style={styles.emptyText}>No messages yet. Start swiping!</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        paddingHorizontal: 20,
        height: 70,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 20,
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 46,
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    newMatchesList: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    newMatchCard: {
        width: 80,
        alignItems: 'center',
        marginRight: 12,
    },
    newMatchImage: {
        width: 75,
        height: 100,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    newMatchName: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    activeDot: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#00e882',
        borderWidth: 2,
        borderColor: '#000',
    },
    messageRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    systemAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    messageName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    unreadText: {
        color: COLORS.primary,
    },
    messageTime: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
    },
    messagePreview: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
    },
    onlineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#00e882',
        borderWidth: 2,
        borderColor: '#000',
        position: 'absolute',
        left: 68,
        bottom: 12,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginLeft: 10,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.2)',
        marginTop: 20,
        fontSize: 16,
        textAlign: 'center',
    }
});

export default ChatScreen;