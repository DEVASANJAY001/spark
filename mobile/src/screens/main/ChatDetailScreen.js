import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, Clipboard, Dimensions, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { presenceService } from '../../services/presenceService';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { 
    FadeInUp, 
    FadeOutDown, 
    Layout, 
    useAnimatedStyle, 
    useSharedValue, 
    withSpring,
    withTiming,
    interpolate,
    runOnJS
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import { subscriptionService } from '../../services/subscriptionService';
import * as ScreenCapture from 'expo-screen-capture';

const { width, height } = Dimensions.get('window');

const POPULAR_EMOJIS = ['❤️', '😂', '🔥', '😍', '✨', '🙌', '💯', '🤔'];

const ChatDetailScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const { matchId, otherUser, createdAt } = route.params;
    const { user, profile } = useAuth();
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
    const [subscription, setSubscription] = useState(null);
    const flatListRef = useRef();
    const typingTimeoutRef = useRef(null);

    // Reanimated Shared Values
    const inputScale = useSharedValue(1);
    const swipeOffset = useSharedValue(0);

    // Prevent screenshots in the chat
    ScreenCapture.usePreventScreenCapture();

    const hasReadReceipts = subscriptionService.hasFeature(subscription, 'read_receipts');

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
            loadSubscription();

            // Hardware back button override
            const backAction = () => {
                navigation.navigate('Main', { screen: 'Chat' });
                return true;
            };
            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

            return () => {
                unsubscribe();
                unsubscribeStatus();
                unsubscribeTyping();
                backHandler.remove();
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            };
        }
    }, [user, matchId, otherUser, profile?.premiumTier]);

    const handleBack = () => {
        navigation.navigate('Main', { screen: 'Chat' });
    };

    const loadSubscription = async () => {
        if (!user?.uid || !profile?.premiumTier) {
            setSubscription(null);
            return;
        }
        const sub = await subscriptionService.getUserSubscription(user.uid, profile.premiumTier);
        setSubscription(sub);
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

    const handleSend = async (emoji = null) => {
        const textToSend = emoji || inputText.trim();
        if (!textToSend || !user) return;

        // Clear input immediately for smooth feel
        const prevText = inputText;
        if (!emoji) setInputText('');
        setReplyingTo(null);

        try {
            if (isEditing && selectedMessage) {
                await chatService.editMessage(matchId, selectedMessage.id, textToSend);
                setIsEditing(false);
                setSelectedMessage(null);
            } else {
                await chatService.sendMessage(matchId, user.uid, textToSend, null, replyingTo);
            }
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        } catch (e) {
            Alert.alert('Error', 'Failed to send message');
            if (!emoji) setInputText(prevText); // Restore on error
        }
    };

    const handleReaction = async (emoji) => {
        if (!selectedMessage || !user) return;
        try {
            await chatService.toggleReaction(matchId, selectedMessage.id, user.uid, emoji);
            setIsOptionsVisible(false);
            setSelectedMessage(null);
        } catch (e) {
            console.error('Failed to react:', e);
        }
    };

    const handleLongPress = (message) => {
        if (message.isDeleted) return;
        setSelectedMessage(message);
        setIsOptionsVisible(true);
    };

    const handleDelete = (mode) => {
        if (!selectedMessage || !user) return;
        chatService.deleteMessage(matchId, selectedMessage.id, mode, user.uid);
        setIsOptionsVisible(false);
        setSelectedMessage(null);
    };

    const handleCopy = () => {
        if (!selectedMessage) return;
        Clipboard.setString(selectedMessage.text);
        setIsOptionsVisible(false);
        setSelectedMessage(null);
    };

    const handleReply = () => {
        if (!selectedMessage) return;
        setReplyingTo(selectedMessage);
        setIsOptionsVisible(false);
        setSelectedMessage(null);
    };

    const handleEdit = () => {
        if (!selectedMessage) return;
        setInputText(selectedMessage.text);
        setIsEditing(true);
        setIsOptionsVisible(false);
    };

    const formatMessageTime = (createdAt) => {
        if (!createdAt) return '';
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatLastSeen = (status) => {
        if (!status) return 'Offline';
        if (status.state === 'online') return 'Active now';
        if (!status.last_changed) return 'Offline';
        
        const lastChanged = new Date(status.last_changed);
        const now = new Date();
        const diff = (now - lastChanged) / 1000;

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return lastChanged.toLocaleDateString();
    };

    const shouldShowTime = (msg, nextMsg) => {
        if (!nextMsg) return true;
        const curDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
        const nextDate = nextMsg.createdAt?.toDate ? nextMsg.createdAt.toDate() : new Date(nextMsg.createdAt);
        return Math.abs(curDate - nextDate) > 30 * 60 * 1000;
    };

    const renderMessage = ({ item, index }) => {
        const isMine = item.senderId === user?.uid;
        const nextMsg = messages[index + 1];
        const showTimeHeader = shouldShowTime(item, nextMsg);

        return (
            <MessageItem 
                item={item} 
                isMine={isMine} 
                showTimeHeader={showTimeHeader}
                swipeOffset={swipeOffset}
                user={user}
                otherUser={otherUser}
                hasReadReceipts={hasReadReceipts}
                handleLongPress={handleLongPress}
                formatMessageTime={formatMessageTime}
            />
        );
    };

const MessageItem = ({ 
    item, isMine, showTimeHeader, swipeOffset, user, otherUser, hasReadReceipts, handleLongPress, formatMessageTime 
}) => {
    if (item.isSystem) {
        return (
            <View style={styles.systemMessageContainer}>
                <Text style={styles.systemMessageText}>{item.text}</Text>
            </View>
        );
    }

    const msgTime = item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    const animatedBubbleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: swipeOffset.value }]
        };
    });

    const timeRevealRightStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(swipeOffset.value, [-80, -20], [1, 0], 'clamp'),
            transform: [{ translateX: interpolate(swipeOffset.value, [-80, 0], [-80, 0], 'clamp') }]
        };
    });

    const timeRevealLeftStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(swipeOffset.value, [20, 80], [0, 1], 'clamp'),
            transform: [{ translateX: interpolate(swipeOffset.value, [0, 80], [0, 80], 'clamp') }]
        };
    });

    return (
        <View style={styles.messageRowWrapper}>
            {showTimeHeader && (
                <Text style={styles.timeHeader}>{formatMessageTime(item.createdAt)}</Text>
            )}
            
            <View style={[styles.swipeContainer, isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                {/* Reveal time on the left when swiping right */}
                <Animated.View style={[styles.timeRevealLeft, timeRevealLeftStyle]}>
                    <Text style={styles.revealTimeText}>{msgTime}</Text>
                </Animated.View>

                <Animated.View style={[
                    styles.messageBubbleContainer, 
                    isMine ? styles.myMessageContainer : styles.theirMessageContainer,
                    animatedBubbleStyle
                ]}>
                    <View style={styles.bubbleWrapper}>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            onLongPress={() => handleLongPress(item)}
                        >
                        {item.replyTo && (
                            <View style={[styles.replyInBubble, isMine ? styles.myReply : styles.theirReply]}>
                                <Text style={styles.replyInBubbleTitle}>
                                    {item.replyTo.senderId === user.uid ? 'You' : otherUser?.firstName}
                                </Text>
                                <Text style={styles.replyInBubbleText} numberOfLines={1}>{item.replyTo.text}</Text>
                            </View>
                        )}
                        {isMine ? (
                            <LinearGradient
                                colors={item.isDeleted ? ['#333', '#222'] : ['#833AB4', '#E1306C']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.myBubble}
                            >
                                <Text style={[styles.myMessageText, item.isDeleted && { color: '#666', fontStyle: 'italic' }]}>
                                    {item.text}
                                </Text>
                                {isMine && hasReadReceipts && !item.isDeleted && (
                                    <View style={styles.readReceiptContainer}>
                                        <Ionicons 
                                            name={item.read ? "checkmark-done" : "checkmark"} 
                                            size={10} 
                                            color="#fff" 
                                            style={{ opacity: 0.8 }}
                                        />
                                    </View>
                                )}
                            </LinearGradient>
                        ) : (
                            <View style={[styles.theirBubble, { backgroundColor: item.isDeleted ? '#1a1a1a' : '#262626' }]}>
                                <Text style={[styles.theirMessageText, { color: item.isDeleted ? '#666' : '#fff' }, item.isDeleted && { fontStyle: 'italic' }]}>
                                    {item.text}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Message Reactions Badge */}
                    {item.reactions && Object.keys(item.reactions).length > 0 && (
                        <View style={[
                            styles.reactionBadgeContainer,
                            isMine ? styles.myReactionBadge : styles.theirReactionBadge
                        ]}>
                            <Text style={styles.reactionBadgeText}>
                                {Object.values(item.reactions).slice(0, 3).join('')}
                                {Object.keys(item.reactions).length > 1 && (
                                    <Text style={styles.reactionCount}> {Object.keys(item.reactions).length}</Text>
                                )}
                            </Text>
                        </View>
                    )}
                </View>
            </Animated.View>

                {/* Instagram style reveal on the right for all messages when swiping left */}
                <Animated.View style={[styles.timeRevealRight, timeRevealRightStyle]}>
                    <Text style={styles.revealTimeText}>{msgTime}</Text>
                </Animated.View>
            </View>
        </View>
    );
};


    const onGestureEvent = (event) => {
        swipeOffset.value = event.nativeEvent.translationX;
    };

    const onHandlerStateChange = (event) => {
        if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
            swipeOffset.value = withSpring(0, { stiffness: 200, damping: 25 });
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Instagram Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
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

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="information-circle-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#FF3366" />
                    </View>
                ) : (
                    <PanGestureHandler
                        onGestureEvent={onGestureEvent}
                        onHandlerStateChange={onHandlerStateChange}
                        activeOffsetX={[-20, 20]}
                        failOffsetY={[-10, 10]}
                    >
                        <View style={styles.flex}>
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                renderItem={renderMessage}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.listContent}
                                inverted
                                showsVerticalScrollIndicator={false}
                                removeClippedSubviews={false}
                            />
                        </View>
                    </PanGestureHandler>
                )}

                {replyingTo && (
                    <View style={styles.replyBanner}>
                        <View style={styles.replyContent}>
                            <Text style={styles.replyTitle}>Replying to {replyingTo.senderId === user?.uid ? 'yourself' : otherUser?.firstName}</Text>
                            <Text style={styles.replyText} numberOfLines={1}>{replyingTo.text}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyingTo(null)}>
                            <Ionicons name="close-circle" size={20} color="#888" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.footerContainer}>
                    <View style={styles.inputArea}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Message..."
                                placeholderTextColor="#888"
                                value={inputText}
                                onChangeText={handleTextChange}
                                multiline
                            />
                        </View>

                        {inputText.trim() ? (
                            <TouchableOpacity onPress={() => handleSend()} style={styles.sendIconBtn}>
                                <LinearGradient
                                    colors={[COLORS.primary, '#FF1493']}
                                    style={styles.sendBadge}
                                >
                                    <Ionicons name={isEditing ? "checkmark" : "arrow-up"} size={22} color="white" />
                                </LinearGradient>
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
                                <TouchableOpacity key={emoji} style={styles.reactionEmoji} onPress={() => handleReaction(emoji)}>
                                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.optionsMenu}>
                            <TouchableOpacity style={styles.optionItem} onPress={handleReply}>
                                <Text style={styles.optionText}>Reply</Text>
                                <Ionicons name="arrow-undo-outline" size={20} color="white" />
                            </TouchableOpacity>
                            {selectedMessage?.senderId === user?.uid && (
                                <TouchableOpacity style={styles.optionItem} onPress={handleEdit}>
                                    <Text style={styles.optionText}>Edit</Text>
                                    <Ionicons name="create-outline" size={20} color="white" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.optionItem} onPress={handleCopy}>
                                <Text style={styles.optionText}>Copy</Text>
                                <Ionicons name="copy-outline" size={20} color="white" />
                            </TouchableOpacity>
                            {selectedMessage?.senderId === user?.uid && (
                                <TouchableOpacity style={styles.optionItem} onPress={() => handleDelete('everyone')}>
                                    <Text style={[styles.optionText, { color: '#ff4444' }]}>Delete for Everyone</Text>
                                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.optionItem} onPress={() => handleDelete('me')}>
                                <Text style={[styles.optionText, { color: '#ff4444' }]}>Delete for Me</Text>
                                <Ionicons name="trash-outline" size={20} color="#ff4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#262626',
    },
    backBtn: { padding: 4 },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    avatarWrapper: { position: 'relative' },
    headerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#333' },
    onlineStatusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#000',
    },
    headerText: { marginLeft: 10 },
    headerName: { color: '#fff', fontSize: 15, fontWeight: '700' },
    headerSub: { color: '#a8a8a8', fontSize: 11, marginTop: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    actionBtn: { padding: 4 },
    
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 12, paddingBottom: 20 },
    timeHeader: { 
        alignSelf: 'center', 
        fontSize: 11, 
        color: '#8e8e8e', 
        fontWeight: '600', 
        marginVertical: 20, 
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    
    messageRowWrapper: { width: '100%', overflow: 'visible' },
    swipeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        overflow: 'visible',
    },
    messageBubbleContainer: {
        maxWidth: '75%',
        marginVertical: 1.5,
    },
    myMessageContainer: { alignSelf: 'flex-end' },
    theirMessageContainer: { alignSelf: 'flex-start' },
    
    myBubble: { 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 22,
        borderBottomRightRadius: 22,
    },
    theirBubble: { 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 22,
        borderBottomLeftRadius: 22,
    },
    
    myMessageText: { color: '#fff', fontSize: 15, lineHeight: 20 },
    theirMessageText: { color: '#fff', fontSize: 15, lineHeight: 20 },
    
    timeRevealLeft: {
        position: 'absolute',
        left: -80,
        width: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeRevealRight: {
        position: 'absolute',
        right: -80,
        width: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    revealTimeText: {
        fontSize: 10,
        color: '#8e8e8e',
        fontWeight: '500',
    },
    
    bubbleWrapper: {
        flexDirection: 'column',
    },
    reactionBadgeContainer: {
        position: 'absolute',
        bottom: -10,
        backgroundColor: '#262626',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#000',
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
    myReactionBadge: {
        right: 0,
    },
    theirReactionBadge: {
        left: 0,
    },
    reactionBadgeText: {
        fontSize: 12,
    },
    reactionCount: {
        fontSize: 10,
        color: '#fff',
        marginLeft: 2,
        fontWeight: '700',
    },

    footerContainer: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#000',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 8,
        minHeight: 44,
        borderWidth: 0.5,
        borderColor: '#363636',
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        paddingVertical: 0,
        marginHorizontal: 10,
    },
    sendIconBtn: { marginLeft: 12 },
    sendBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    
    replyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121212',
        padding: 12,
        borderTopWidth: 0.5,
        borderTopColor: '#262626',
    },
    replyContent: { flex: 1 },
    replyTitle: { color: '#8e8e8e', fontSize: 11, fontWeight: '700' },
    replyText: { color: '#fff', fontSize: 13, marginTop: 2 },
    
    editingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#121212',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    editingText: { color: '#8e8e8e', fontSize: 12 },
    cancelEdit: { color: '#FF3366', fontSize: 12, fontWeight: '700' },
    
    readReceiptContainer: {
        position: 'absolute',
        bottom: 4,
        right: 8,
    },
    
    optionsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    optionsContent: {
        backgroundColor: '#262626',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        paddingBottom: 40,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 0.5,
        borderBottomColor: '#363636',
    },
    optionText: { color: '#fff', fontSize: 16, marginLeft: 15 },
    deleteText: { color: '#ED4956' },
    
    viewerOverlay: { flex: 1, backgroundColor: '#000' },
    viewerSafe: { flex: 1 },
    viewerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    viewerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
    viewerImageContainer: { flex: 1, justifyContent: 'center' },
    fullImage: { width: '100%', height: '100%' },
    viewerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        borderTopWidth: 0.5,
        borderTopColor: '#262626',
    },
    viewerAction: { alignItems: 'center', gap: 6 },
    viewerActionText: { color: '#fff', fontSize: 12 },
    systemMessageContainer: { alignSelf: 'center', marginVertical: 15, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    systemMessageText: { fontSize: 11, color: '#666' },
    sendIconBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    sendBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
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
    editedTagTheir: { fontSize: 10, color: 'rgba(255,255,255,0.3)', alignSelf: 'flex-start', marginTop: 2 },
    readReceiptContainer: {
        alignSelf: 'flex-end',
        marginTop: 2,
        marginRight: -2,
    }
});

export default ChatDetailScreen;
