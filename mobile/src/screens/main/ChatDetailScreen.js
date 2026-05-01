import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, Clipboard, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { presenceService } from '../../services/presenceService';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import * as ScreenCapture from 'expo-screen-capture';

const { width, height } = Dimensions.get('window');

const POPULAR_EMOJIS = ['❤️', '😂', '🔥', '😍', '✨', '🙌', '💯', '🤔'];

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

    // Swipe to see time animation
    const swipeAnim = useRef(new Animated.Value(0)).current;

    // Prevent screenshots in the chat
    ScreenCapture.usePreventScreenCapture();

    useEffect(() => {
        if (user && matchId && otherUser) {
            const otherUid = otherUser.uid || otherUser.id;
            
            const unsubscribe = chatService.listenMessages(matchId, (msgs) => {
                const filtered = msgs.filter(m => {
                    if (!user) return true;
                    return !m.deletedBy || !m.deletedBy.includes(user.uid);
                });
                setMessages(filtered);
                setLoading(false);
            });

            const unsubscribeStatus = presenceService.subscribeToUserStatus(otherUid, (status) => {
                setOtherStatus(status);
            });

            const unsubscribeTyping = chatService.subscribeToTypingStatus(matchId, otherUid, (typing) => {
                setIsOtherTyping(typing);
            });

            chatService.markAsRead(matchId, user.uid);

            return () => {
                unsubscribe();
                unsubscribeStatus();
                unsubscribeTyping();
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            };
        }
    }, [user, matchId, otherUser]);

    const onGestureEvent = Animated.event(
        [{ nativeEvent: { translationX: swipeAnim } }],
        { useNativeDriver: true }
    );

    const onHandlerStateChange = (event) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            Animated.spring(swipeAnim, {
                toValue: 0,
                useNativeDriver: true,
                friction: 5
            }).start();
        }
    };

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

    const handleSend = async (textOverride) => {
        const textToSend = (textOverride || inputText).trim();
        if (textToSend === '') return;

        setInputText('');

        try {
            if (isEditing && selectedMessage) {
                await chatService.editMessage(matchId, selectedMessage.id, textToSend);
                setIsEditing(false);
                setSelectedMessage(null);
            } else {
                await chatService.sendMessage(matchId, user.uid, textToSend, null, replyingTo);
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
            await chatService.deleteMessage(matchId, selectedMessage.id, mode, user.uid);
            setSelectedMessage(null);
        } catch (error) {
            Alert.alert("Error", "Delete failed.");
        }
    };

    const handleCopy = () => {
        if (selectedMessage) {
            Clipboard.setString(selectedMessage.text);
            setIsOptionsVisible(false);
            setSelectedMessage(null);
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

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (diffDays === 0) return timeStr;
        if (diffDays === 1) return `Yesterday ${timeStr}`;
        if (diffDays < 7) return `${date.toLocaleDateString([], { weekday: 'long' })} ${timeStr}`;
        
        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
    };

    const shouldShowTime = (currentMsg, nextMsg) => {
        if (!nextMsg) return true;
        if (!currentMsg.createdAt || !nextMsg.createdAt) return false;
        
        const curDate = currentMsg.createdAt.toDate ? currentMsg.createdAt.toDate() : new Date(currentMsg.createdAt);
        const nextDate = nextMsg.createdAt.toDate ? nextMsg.createdAt.toDate() : new Date(nextMsg.createdAt);
        
        // Show time if diff > 30 mins
        return Math.abs(curDate - nextDate) > 30 * 60 * 1000;
    };

    const renderMessage = ({ item, index }) => {
        if (!user) return null;
        const isMine = item.senderId === user.uid;
        
        const nextMsg = messages[index + 1];
        const showTimeHeader = shouldShowTime(item, nextMsg);

        if (item.isSystem) {
            return (
                <View style={styles.systemMessageContainer}>
                    <Text style={styles.systemMessageText}>{item.text}</Text>
                </View>
            );
        }

        const msgTime = item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        // Swipe limit logic
        const translateX = swipeAnim.interpolate({
            inputRange: [-100, 0, 100],
            outputRange: [-60, 0, 60],
            extrapolate: 'clamp'
        });

        return (
            <View>
                {showTimeHeader && (
                    <Text style={styles.timeHeader}>{formatMessageTime(item.createdAt)}</Text>
                )}
                
                <View style={styles.swipeMessageWrapper}>
                    {/* Hidden Time to be revealed on swipe */}
                    <Animated.View style={[styles.hiddenTimeContainer, { opacity: swipeAnim.interpolate({ inputRange: [-60, -20, 0], outputRange: [1, 0, 0] }) }]}>
                        <Text style={styles.hiddenTimeText}>{msgTime}</Text>
                    </Animated.View>

                    <Animated.View style={{ transform: [{ translateX }] }}>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            onLongPress={() => handleLongPress(item)}
                            style={[styles.messageBubbleContainer, isMine ? styles.myMessageContainer : styles.theirMessageContainer]}
                        >
                            {item.replyingTo && (
                                <View style={[styles.replyInBubble, isMine ? styles.myReply : styles.theirReply]}>
                                    <Text style={styles.replyInBubbleTitle}>
                                        {item.replyingTo.senderId === user.uid ? 'You' : otherUser?.firstName}
                                    </Text>
                                    <Text style={styles.replyInBubbleText} numberOfLines={1}>{item.replyingTo.text}</Text>
                                </View>
                            )}
                            {isMine ? (
                                <LinearGradient
                                    colors={item.isDeleted ? ['#333', '#222'] : ['#FF3366', '#FF1493']}
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
                                <View style={[styles.theirBubble, { backgroundColor: item.isDeleted ? '#1a1a1a' : 'rgba(255,255,255,0.1)' }]}>
                                    <Text style={[styles.theirMessageText, { color: item.isDeleted ? '#666' : '#fff' }, item.isDeleted && { fontStyle: 'italic' }]}>
                                        {item.text}
                                    </Text>
                                    {item.isEdited && !item.isDeleted && <Text style={styles.editedTagTheir}>edited</Text>}
                                </View>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Instagram Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => setIsViewerVisible(true)}
                        style={styles.headerTitleContainer}
                    >
                        <View style={styles.avatarWrapper}>
                            <Image source={{ uri: otherUser?.photos?.[0] || 'https://picsum.photos/40' }} style={styles.headerAvatar} />
                            {otherStatus?.state === 'online' && <View style={styles.onlineStatusDot} />}
                        </View>
                        <View style={styles.headerText}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.headerName}>{otherUser?.firstName}</Text>
                                {otherUser?.isVerified && (
                                    <Ionicons name="checkmark-circle" size={16} color="#FF3366" style={{ marginLeft: 4 }} />
                                )}
                            </View>
                            <Text style={styles.headerSub}>
                                {isOtherTyping ? 'typing...' : formatLastSeen(otherStatus)}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="videocam-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="information-circle-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#FF3366" />
                    </View>
                ) : (
                    <PanGestureHandler
                        onGestureEvent={onGestureEvent}
                        onHandlerStateChange={onHandlerStateChange}
                        activeOffsetX={[-10, 10]}
                    >
                        <Animated.View style={styles.flex}>
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
                        </Animated.View>
                    </PanGestureHandler>
                )}

                {replyingTo && (
                    <View style={styles.replyBanner}>
                        <View style={styles.replyContent}>
                            <Text style={styles.replyTitle}>Replying to {replyingTo.senderId === user.uid ? 'Yourself' : otherUser?.firstName}</Text>
                            <Text style={styles.replyText} numberOfLines={1}>{replyingTo.text}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyingTo(null)}>
                            <Ionicons name="close-circle" size={20} color="#888" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Instagram-style Emoji Bar & Input Area */}
                <View style={styles.footerContainer}>
                    <View style={styles.emojiBar}>
                        {POPULAR_EMOJIS.map(emoji => (
                            <TouchableOpacity 
                                key={emoji} 
                                style={styles.emojiItem}
                                onPress={() => handleSend(emoji)}
                            >
                                <Text style={styles.emojiText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <View style={styles.inputArea}>
                        <TouchableOpacity style={styles.cameraBtn}>
                            <Ionicons name="camera" size={24} color="#fff" />
                        </TouchableOpacity>
                        
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Message..."
                                placeholderTextColor="#888"
                                value={inputText}
                                onChangeText={handleTextChange}
                                multiline
                            />
                            {!inputText && (
                                <View style={styles.inputActions}>
                                    <TouchableOpacity style={styles.inputActionBtn}>
                                        <Ionicons name="mic-outline" size={22} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.inputActionBtn}>
                                        <Ionicons name="image-outline" size={22} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.inputActionBtn}>
                                        <Ionicons name="happy-outline" size={22} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {inputText.trim() ? (
                            <TouchableOpacity onPress={() => handleSend()}>
                                <Text style={styles.sendText}>{isEditing ? 'Done' : 'Send'}</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
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
                <View style={styles.viewerOverlay}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    <SafeAreaView style={styles.viewerSafe}>
                        <View style={styles.viewerHeader}>
                            <TouchableOpacity onPress={() => setIsViewerVisible(false)}>
                                <Ionicons name="close" size={30} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.viewerName}>{otherUser?.firstName}</Text>
                            <View style={{ width: 30 }} />
                        </View>
                        <View style={styles.viewerImageContainer}>
                            <Image source={{ uri: otherUser?.photos?.[0] }} style={styles.fullImage} resizeMode="contain" />
                        </View>
                        <View style={styles.viewerFooter}>
                            <TouchableOpacity style={styles.viewerAction} onPress={() => setIsViewerVisible(false)}>
                                <Ionicons name="chatbubble-outline" size={24} color="white" />
                                <Text style={styles.viewerActionText}>Message</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.viewerAction} onPress={() => {
                                setIsViewerVisible(false);
                                navigation.navigate('UserProfile', { userId: otherUser?.uid || otherUser?.id });
                            }}>
                                <Ionicons name="person-outline" size={24} color="white" />
                                <Text style={styles.viewerActionText}>View Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* Message Options Modal */}
            <Modal
                visible={isOptionsVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsOptionsVisible(false)}
            >
                <TouchableOpacity activeOpacity={1} style={styles.optionsOverlay} onPress={() => setIsOptionsVisible(false)}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.optionsContainer}>
                        <View style={styles.reactionRow}>
                            {POPULAR_EMOJIS.slice(0, 6).map(emoji => (
                                <TouchableOpacity key={emoji} style={styles.reactionEmoji}>
                                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.optionsMenu}>
                            <TouchableOpacity style={styles.optionItem} onPress={startReply}>
                                <Text style={styles.optionText}>Reply</Text>
                                <Ionicons name="arrow-undo-outline" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.optionItem} onPress={handleCopy}>
                                <Text style={styles.optionText}>Copy</Text>
                                <Ionicons name="copy-outline" size={20} color="white" />
                            </TouchableOpacity>
                            {selectedMessage?.senderId === user?.uid && (
                                <TouchableOpacity style={styles.optionItem} onPress={startEdit}>
                                    <Text style={styles.optionText}>Edit</Text>
                                    <Ionicons name="pencil-outline" size={20} color="white" />
                                </TouchableOpacity>
                            )}
                            {selectedMessage?.senderId === user?.uid && (
                                <TouchableOpacity style={styles.optionItem} onPress={() => handleDelete('everyone')}>
                                    <Text style={[styles.optionText, { color: '#ff4444' }]}>Unsend</Text>
                                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.optionItem, { borderBottomWidth: 0 }]} onPress={() => handleDelete('me')}>
                                <Text style={styles.optionText}>Delete for Me</Text>
                                <Ionicons name="trash-outline" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 60,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backBtn: { padding: 5, marginRight: 10 },
    headerTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    avatarWrapper: { position: 'relative' },
    headerAvatar: { width: 36, height: 36, borderRadius: 18 },
    onlineStatusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#00e882',
        borderWidth: 2,
        borderColor: '#000',
    },
    headerText: { marginLeft: 10 },
    headerName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    headerSub: { fontSize: 11, color: '#888' },
    actionBtn: { padding: 8, marginLeft: 5 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: { paddingHorizontal: 15, paddingBottom: 20 },
    matchIntro: { alignItems: 'center', marginVertical: 40 },
    introAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 15 },
    introTitle: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
    introDate: { fontSize: 11, color: '#555', marginTop: 5 },
    timeHeader: {
        alignSelf: 'center',
        fontSize: 11,
        color: '#555',
        fontWeight: '700',
        marginVertical: 15,
        textTransform: 'uppercase',
    },
    swipeMessageWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    hiddenTimeContainer: {
        position: 'absolute',
        right: 0,
        justifyContent: 'center',
        height: '100%',
        paddingRight: 10,
    },
    hiddenTimeText: {
        color: '#555',
        fontSize: 10,
        fontWeight: 'bold',
    },
    messageBubbleContainer: { marginVertical: 2, maxWidth: '80%' },
    myMessageContainer: { alignSelf: 'flex-end' },
    theirMessageContainer: { alignSelf: 'flex-start' },
    myBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderBottomRightRadius: 4 },
    theirBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderBottomLeftRadius: 4 },
    myMessageText: { color: 'white', fontSize: 15 },
    theirMessageText: { color: '#fff', fontSize: 15 },
    systemMessageContainer: {
        alignSelf: 'center',
        marginVertical: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    systemMessageText: { fontSize: 11, color: '#666' },
    footerContainer: { paddingBottom: Platform.OS === 'ios' ? 30 : 15, backgroundColor: '#000' },
    emojiBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, paddingHorizontal: 10 },
    emojiItem: { padding: 5 },
    emojiText: { fontSize: 24 },
    inputArea: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 10 },
    cameraBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF3366', justifyContent: 'center', alignItems: 'center' },
    inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#262626', borderRadius: 20, paddingHorizontal: 12, minHeight: 40 },
    input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 8 },
    inputActions: { flexDirection: 'row', gap: 12 },
    sendText: { color: '#0EA5E9', fontWeight: '700', fontSize: 16, marginRight: 5 },
    replyInBubble: { padding: 8, borderRadius: 12, marginBottom: 4, opacity: 0.8 },
    myReply: { backgroundColor: 'rgba(0,0,0,0.2)', borderLeftWidth: 2, borderLeftColor: '#fff' },
    theirReply: { backgroundColor: 'rgba(255,255,255,0.05)', borderLeftWidth: 2, borderLeftColor: '#FF3366' },
    replyInBubbleTitle: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    replyInBubbleText: { color: '#ccc', fontSize: 12 },
    editingBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#1a1a1a' },
    editingText: { color: '#FF3366', fontSize: 12, fontWeight: 'bold' },
    cancelEdit: { color: '#ff4444', fontSize: 12 },
    replyBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#1a1a1a', borderTopWidth: 0.5, borderTopColor: '#333' },
    replyContent: { flex: 1, borderLeftWidth: 2, borderLeftColor: '#FF3366', paddingLeft: 10 },
    replyTitle: { color: '#FF3366', fontSize: 11, fontWeight: 'bold' },
    replyText: { color: '#888', fontSize: 12 },
    optionsOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    optionsContainer: { width: '80%', alignItems: 'center' },
    reactionRow: { flexDirection: 'row', backgroundColor: '#262626', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 30, marginBottom: 15, gap: 10 },
    optionsMenu: { backgroundColor: '#262626', borderRadius: 15, width: '100%', overflow: 'hidden' },
    optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: '#333' },
    optionText: { color: 'white', fontSize: 16, fontWeight: '500' },
    viewerOverlay: { flex: 1, backgroundColor: '#000' },
    viewerSafe: { flex: 1 },
    viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
    viewerName: { color: 'white', fontSize: 18, fontWeight: '700' },
    viewerImageContainer: { flex: 1, justifyContent: 'center' },
    fullImage: { width: '100%', height: '100%' },
    viewerFooter: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingBottom: 40 },
    viewerAction: { alignItems: 'center', gap: 5 },
    viewerActionText: { color: 'white', fontSize: 12 },
    editedTag: { fontSize: 10, color: 'rgba(255,255,255,0.5)', alignSelf: 'flex-end', marginTop: 2 },
    editedTagTheir: { fontSize: 10, color: 'rgba(255,255,255,0.3)', alignSelf: 'flex-start', marginTop: 2 }
});

export default ChatDetailScreen;
