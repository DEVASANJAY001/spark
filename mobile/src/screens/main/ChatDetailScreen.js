import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { presenceService } from '../../services/presenceService';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import * as ScreenCapture from 'expo-screen-capture';

const ChatDetailScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const { matchId, otherUser, createdAt } = route.params;
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [isViewerVisible, setIsViewerVisible] = useState(false);
    const [otherStatus, setOtherStatus] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const flatListRef = useRef();
    const typingTimeoutRef = useRef(null);

    // Prevent screenshots in the chat
    ScreenCapture.usePreventScreenCapture();

    useEffect(() => {
        if (user && matchId && otherUser) {
            const otherUid = otherUser.uid || otherUser.id;
            
            const unsubscribe = chatService.listenMessages(matchId, (msgs) => {
                // Filter out messages deleted by me
                const filtered = msgs.filter(m => {
                    if (!user) return true;
                    return !m.deletedBy || !m.deletedBy.includes(user.uid);
                });
                setMessages(filtered);
                setLoading(false);
            });

            // Status Listener
            const unsubscribeStatus = presenceService.subscribeToUserStatus(otherUid, (status) => {
                setOtherStatus(status);
            });

            // Typing Listener
            const unsubscribeTyping = chatService.subscribeToTypingStatus(matchId, otherUid, (typing) => {
                setIsOtherTyping(typing);
            });

            // Mark as read when entering
            chatService.markAsRead(matchId, user.uid);

            return () => {
                unsubscribe();
                unsubscribeStatus();
                unsubscribeTyping();
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            };
        }
    }, [user, matchId, otherUser]);

    const handleTextChange = (text) => {
        setInputText(text);
        
        if (!isTyping) {
            setIsTyping(true);
            chatService.setTypingStatus(matchId, user.uid, true);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            chatService.setTypingStatus(matchId, user.uid, false);
        }, 2000);
    };

    const formatLastSeen = (status) => {
        if (!status) return 'Offline';
        if (status.state === 'online') return 'Online now';
        
        const lastChanged = status.last_changed;
        if (!lastChanged) return 'Offline';
        
        const date = new Date(lastChanged);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Last seen just now';
        if (diffMins < 60) return `Last seen ${diffMins}m ago`;
        
        return `Last seen ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const handleSend = async () => {
        if (inputText.trim() === '') return;

        const text = inputText.trim();
        setInputText('');

        try {
            if (isEditing && selectedMessage) {
                await chatService.editMessage(matchId, selectedMessage.id, text);
                setIsEditing(false);
                setSelectedMessage(null);
            } else {
                await chatService.sendMessage(matchId, user.uid, text, null, replyingTo);
                setReplyingTo(null);
            }
        } catch (error) {
            console.error('Send/Edit error:', error);
            Alert.alert("Error", "Action failed.");
        }
    };

    const handleLongPress = (message) => {
        if (message.isDeleted || message.isSystem) return;
        setSelectedMessage(message);
        setIsOptionsVisible(true);
    };

    const handleDelete = async (mode) => {
        setIsOptionsVisible(false);
        if (!selectedMessage) return;

        try {
            if (!user) return;
            await chatService.deleteMessage(matchId, selectedMessage.id, mode, user.uid);
            setSelectedMessage(null);
        } catch (error) {
            Alert.alert("Error", "Delete failed.");
        }
    };

    const startEdit = () => {
        setIsOptionsVisible(false);
        setIsEditing(true);
        setInputText(selectedMessage.text);
    };

    const startReply = () => {
        setIsOptionsVisible(false);
        setReplyingTo(selectedMessage);
    };

    const renderMessage = ({ item }) => {
        if (!user) return null;
        const isMine = item.senderId === user.uid;

        if (item.isSystem) {
            return (
                <View style={[styles.systemMessageContainer, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.systemMessageText, { color: colors.textMuted }]}>{item.text}</Text>
                </View>
            );
        }

        return (
            <TouchableOpacity 
                activeOpacity={0.8}
                onLongPress={() => handleLongPress(item)}
                style={[styles.messageBubbleContainer, isMine ? styles.myMessageContainer : styles.theirMessageContainer]}
            >
                {isMine ? (
                    <LinearGradient
                        colors={item.isDeleted ? ['#333', '#222'] : [colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.myBubble}
                    >
                        <Text style={[styles.myMessageText, item.isDeleted && { color: '#666', fontStyle: 'italic' }]}>
                            {item.text}
                        </Text>
                        {item.isEdited && !item.isDeleted && <Text style={styles.editedTag}>edited</Text>}
                    </LinearGradient>
                ) : (
                    <View style={[styles.theirBubble, { backgroundColor: item.isDeleted ? '#1a1a1a' : colors.surface }]}>
                        <Text style={[styles.theirMessageText, { color: item.isDeleted ? '#666' : colors.text }, item.isDeleted && { fontStyle: 'italic' }]}>
                            {item.text}
                        </Text>
                        {item.isEdited && !item.isDeleted && <Text style={styles.editedTagTheir}>edited</Text>}
                    </View>
                )}
            </TouchableOpacity>
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <TouchableOpacity 
                            onPress={() => setIsViewerVisible(true)}
                            style={styles.avatarWrapper}
                        >
                            <Image source={{ uri: otherUser?.photos?.[0] || 'https://picsum.photos/40' }} style={styles.headerAvatar} />
                            {otherStatus?.state === 'online' && <View style={styles.onlineStatusDot} />}
                        </TouchableOpacity>
                        <View style={styles.headerText}>
                            <Text style={styles.headerName}>{otherUser?.firstName}</Text>
                            <Text style={styles.headerSub}>
                                {isOtherTyping ? 'typing...' : formatLastSeen(otherStatus)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
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
                            <View style={styles.matchIntro}>
                                <Image source={{ uri: otherUser?.photos?.[0] }} style={styles.introAvatar} />
                                <Text style={styles.introTitle}>You matched with {otherUser?.firstName}</Text>
                                <Text style={styles.introDate}>
                                    {createdAt?.toDate ? createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString()}
                                </Text>
                            </View>
                        }
                    />
                )}

                {replyingTo && (
                    <View style={styles.replyBanner}>
                        <View style={styles.replyContent}>
                            <Text style={styles.replyTitle}>Replying to {replyingTo.senderId === user.uid ? 'Yourself' : otherUser?.firstName}</Text>
                            <Text style={styles.replyText} numberOfLines={1}>{replyingTo.text}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyingTo(null)}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
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
                            onChangeText={handleTextChange}
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
                        <Ionicons name={isEditing ? "checkmark" : (replyingTo ? "arrow-undo" : "send")} size={22} color="white" />
                    </TouchableOpacity>
                </View>
                {isEditing && (
                    <View style={styles.editingBanner}>
                        <Text style={styles.editingText}>Editing message...</Text>
                        <TouchableOpacity onPress={() => { setIsEditing(false); setInputText(''); setSelectedMessage(null); }}>
                            <Text style={styles.cancelEdit}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* Profile Picture Viewer */}
            <Modal
                visible={isViewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsViewerVisible(false)}
            >
                <TouchableOpacity 
                    activeOpacity={1} 
                    style={styles.viewerOverlay}
                    onPress={() => setIsViewerVisible(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.viewerContent}>
                        <Image 
                            source={{ uri: otherUser?.photos?.[0] }} 
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                        <TouchableOpacity 
                            style={styles.viewerClose}
                            onPress={() => setIsViewerVisible(false)}
                        >
                            <Ionicons name="close-circle" size={40} color="white" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Message Options Modal */}
            <Modal
                visible={isOptionsVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsOptionsVisible(false)}
            >
                <TouchableOpacity 
                    activeOpacity={1} 
                    style={styles.optionsOverlay}
                    onPress={() => setIsOptionsVisible(false)}
                >
                    <View style={[styles.optionsContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.optionsHeader}>
                            <View style={styles.optionsHandle} />
                        </View>
                        
                        {selectedMessage?.senderId === user?.uid && (
                            <TouchableOpacity style={styles.optionItem} onPress={startEdit}>
                                <Ionicons name="pencil" size={20} color="white" />
                                <Text style={styles.optionText}>Edit Message</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.optionItem} onPress={startReply}>
                            <Ionicons name="arrow-undo" size={20} color="white" />
                            <Text style={styles.optionText}>Reply</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem} onPress={() => handleDelete('me')}>
                            <Ionicons name="trash-outline" size={20} color="white" />
                            <Text style={styles.optionText}>Delete for Me</Text>
                        </TouchableOpacity>

                        {selectedMessage?.senderId === user?.uid && (
                            <TouchableOpacity style={styles.optionItem} onPress={() => handleDelete('everyone')}>
                                <Ionicons name="trash" size={20} color="#ff4444" />
                                <Text style={[styles.optionText, { color: '#ff4444' }]}>Delete for Everyone</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={[styles.optionItem, { marginTop: 10 }]} onPress={() => setIsOptionsVisible(false)}>
                            <Text style={[styles.optionText, { color: '#888', textAlign: 'center', width: '100%' }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 70,
    },
    backBtn: {
        padding: 5,
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    avatarWrapper: {
        position: 'relative',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    onlineStatusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#00e882',
        borderWidth: 2,
        borderColor: '#000',
    },
    headerText: {
        marginLeft: 12,
    },
    headerName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
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
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    matchIntro: {
        alignItems: 'center',
        marginVertical: 60,
    },
    introAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    introTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
    },
    introDate: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    messageBubbleContainer: {
        marginVertical: 4,
        maxWidth: '75%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
    },
    myBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 22,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 22,
        borderBottomLeftRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    myMessageText: {
        color: 'white',
        fontSize: 16,
        lineHeight: 22,
    },
    theirMessageText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 22,
    },
    systemMessageContainer: {
        alignSelf: 'center',
        marginVertical: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    systemMessageText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: 'bold',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
        backgroundColor: 'transparent',
    },
    attachmentBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 22,
        marginHorizontal: 12,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
        color: '#fff',
        maxHeight: 100,
    },
    emojiBtn: {
        padding: 5,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    viewerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    viewerClose: {
        position: 'absolute',
        top: 50,
        right: 20,
    },
    editedTag: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        alignSelf: 'flex-end',
        marginTop: 2,
    },
    editedTagTheir: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.3)',
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    editingBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    editingText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    cancelEdit: {
        color: '#ff4444',
        fontSize: 12,
    },
    replyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    replyContent: {
        flex: 1,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
        paddingLeft: 10,
        marginRight: 10,
    },
    replyTitle: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    replyText: {
        color: '#ccc',
        fontSize: 13,
        marginTop: 2,
    },
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    optionsContent: {
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    optionsHeader: {
        alignItems: 'center',
        paddingVertical: 15,
    },
    optionsHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        gap: 15,
    },
    optionText: {
        color: 'white',
        fontSize: 16,
    }
});

export default ChatDetailScreen;
