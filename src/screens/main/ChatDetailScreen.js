import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';

const ChatDetailScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const { matchId, otherUser, createdAt } = route.params;
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef();

    useEffect(() => {
        if (user && matchId) {
            const unsubscribe = chatService.listenMessages(matchId, (msgs) => {
                setMessages(msgs);
                setLoading(false);
            });

            // Mark as read when entering
            chatService.markAsRead(matchId, user.uid);

            return () => unsubscribe();
        }
    }, [user, matchId]);

    const handleSend = async () => {
        if (inputText.trim() === '') return;

        const text = inputText.trim();
        setInputText('');

        try {
            await chatService.sendMessage(matchId, user.uid, text);
        } catch (error) {
            console.error('Send error:', error);
            Alert.alert("Send Error", error.message || "Failed to send message.");
        }
    };

    const renderMessage = ({ item }) => {
        const isMine = item.senderId === user.uid;

        if (item.isSystem) {
            return (
                <View style={[styles.systemMessageContainer, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.systemMessageText, { color: colors.textMuted }]}>{item.text}</Text>
                </View>
            );
        }

        return (
            <View style={[styles.messageBubbleContainer, isMine ? styles.myMessageContainer : styles.theirMessageContainer]}>
                {isMine ? (
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.myBubble}
                    >
                        <Text style={styles.myMessageText}>{item.text}</Text>
                    </LinearGradient>
                ) : (
                    <View style={[styles.theirBubble, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.theirMessageText, { color: colors.text }]}>{item.text}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Image source={{ uri: otherUser?.photos?.[0] || 'https://picsum.photos/40' }} style={[styles.headerAvatar, { backgroundColor: colors.surface }]} />
                        <View style={styles.headerText}>
                            <Text style={[styles.headerName, { color: colors.text }]}>{otherUser?.firstName}</Text>
                            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Active recently</Text>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="shield-checkmark" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        renderItem={renderMessage}
                        inverted
                        contentContainerStyle={styles.messageList}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={<View style={{ height: 10 }} />}
                        ListFooterComponent={
                            <View>
                                <View style={styles.matchIntro}>
                                    <Image source={{ uri: otherUser?.photos?.[0] }} style={styles.introAvatar} />
                                    <Text style={[styles.introTitle, { color: colors.text }]}>You matched with {otherUser?.firstName}</Text>
                                    <Text style={styles.introDate}>
                                        {createdAt?.toDate ? createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={[styles.encryptionNotice, { backgroundColor: colors.isDark ? '#2D2D1B' : '#FFFBE6', borderColor: colors.isDark ? '#4F4F2F' : '#FFE58F' }]}>
                                    <Ionicons name="lock-closed" size={12} color={colors.gold} />
                                    <Text style={[styles.encryptionText, { color: colors.gold }]}>
                                        Messages are end-to-end encrypted. No one outside of this chat, not even Spark, can read them.
                                    </Text>
                                </View>
                            </View>
                        }
                    />
                )}

                {/* Input Area */}
                <View style={[styles.inputArea, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.attachmentBtn}>
                        <Ionicons name="add-circle-outline" size={28} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textMuted}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity style={styles.emojiBtn}>
                            <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Text style={[styles.sendBtnText, { color: colors.primary }, !inputText.trim() && { color: colors.textMuted }]}>SEND</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        padding: 5,
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 5,
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#eee',
    },
    headerText: {
        marginLeft: 10,
    },
    headerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    headerSub: {
        fontSize: 11,
        color: COLORS.grey,
    },
    headerActions: {
        flexDirection: 'row',
    },
    actionBtn: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    matchIntro: {
        alignItems: 'center',
        marginVertical: 40,
    },
    introAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 15,
    },
    introTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    introDate: {
        fontSize: 12,
        color: COLORS.grey,
        marginTop: 5,
    },
    messageBubbleContainer: {
        marginVertical: 4,
        maxWidth: '80%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
    },
    myBubble: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        backgroundColor: '#f1f2f6',
    },
    myMessageText: {
        color: 'white',
        fontSize: 16,
    },
    theirMessageText: {
        color: COLORS.dark,
        fontSize: 16,
    },
    systemMessageContainer: {
        alignSelf: 'center',
        marginVertical: 15,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 15,
    },
    systemMessageText: {
        fontSize: 12,
        color: COLORS.grey,
        fontWeight: 'bold',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
    },
    attachmentBtn: {
        padding: 5,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f2f6',
        borderRadius: 25,
        marginHorizontal: 10,
        paddingHorizontal: 15,
    },
    input: {
        flex: 1,
        paddingVertical: 8,
        fontSize: 16,
        color: COLORS.dark,
        maxHeight: 100,
    },
    emojiBtn: {
        padding: 5,
    },
    sendBtn: {
        paddingHorizontal: 10,
    },
    sendBtnText: {
        color: COLORS.primary,
        fontWeight: '900',
        fontSize: 14,
    },
    sendBtnDisabled: {
        opacity: 0.5,
    },
    sendBtnTextDisabled: {
        color: COLORS.lightGrey,
    },
    encryptionNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 15,
        backgroundColor: '#fffbe6',
        borderRadius: 12,
        marginHorizontal: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ffe58f',
    },
    encryptionText: {
        fontSize: 11,
        color: '#8b6d00',
        textAlign: 'center',
        marginLeft: 8,
        lineHeight: 16,
        fontWeight: '500',
    }
});

export default ChatDetailScreen;
