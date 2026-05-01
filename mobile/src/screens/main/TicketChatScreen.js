import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { COLORS, SPACING, BRAND_COLORS } from '../../constants/theme';
import useAuth from '../../hooks/useAuth';
import { supportService } from '../../services/supportService';
import { db } from '../../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const TicketChatScreen = ({ route, navigation }) => {
    const { ticket: initialTicket } = route.params;
    const { user } = useAuth();
    const [ticket, setTicket] = useState(initialTicket);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef();
    
    // Swipe to see time animation
    const swipeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'tickets', initialTicket.id), (doc) => {
            if (doc.exists()) {
                setTicket({ id: doc.id, ...doc.data() });
            }
        });
        return () => unsubscribe();
    }, [initialTicket.id]);

    const handleSend = async () => {
        if (!message.trim() || sending) return;
        setSending(true);
        try {
            await supportService.sendReply(ticket.id, message, 'User');
            setMessage('');
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

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

    const allMessages = [
        {
            message: ticket.message,
            sender: 'User',
            timestamp: ticket.createdAt?.toDate ? ticket.createdAt.toDate().toISOString() : new Date().toISOString(),
            isInitial: true
        },
        ...(ticket.replies || [])
    ];

    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'User';
        const msgTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
                activeOffsetX={[-10, 10]}
            >
                <Animated.View style={[
                    styles.messageContainer,
                    { transform: [{ translateX: swipeAnim }] }
                ]}>
                    <View style={[styles.messageWrapper, isUser ? styles.userMessageWrapper : styles.adminMessageWrapper]}>
                        <View style={[
                            styles.messageBubble, 
                            isUser ? styles.userBubble : styles.adminBubble
                        ]}>
                            <Text style={styles.messageText}>{item.message}</Text>
                        </View>
                    </View>

                    {/* Hidden Time on Right */}
                    <Animated.View style={[
                        styles.hiddenTimeContainer,
                        {
                            opacity: swipeAnim.interpolate({
                                inputRange: [-60, -20],
                                outputRange: [1, 0],
                                extrapolate: 'clamp'
                            }),
                            transform: [{
                                translateX: swipeAnim.interpolate({
                                    inputRange: [-60, 0],
                                    outputRange: [0, 60],
                                    extrapolate: 'clamp'
                                })
                            }]
                        }
                    ]}>
                        <Text style={styles.hiddenTimeText}>{msgTime}</Text>
                    </Animated.View>
                </Animated.View>
            </PanGestureHandler>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a1a1a', '#000']} style={styles.headerGradient}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color="white" />
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <View style={styles.supportAvatar}>
                                <Ionicons name="headset" size={20} color="white" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle} numberOfLines={1}>{ticket.subject}</Text>
                                <View style={styles.statusRow}>
                                    <View style={[styles.statusDot, { backgroundColor: ticket.status === 'open' ? '#00FF88' : '#666' }]} />
                                    <Text style={styles.headerSubtitle}>Spark Support • {ticket.status.toUpperCase()}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <FlatList
                ref={flatListRef}
                data={allMessages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                showsVerticalScrollIndicator={false}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <BlurView intensity={80} tint="dark" style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Describe your issue..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={!message.trim() || sending}
                        >
                            <LinearGradient
                                colors={message.trim() ? [BRAND_COLORS.blue, BRAND_COLORS.pink] : ['#333', '#222']}
                                style={styles.sendGradient}
                            >
                                {sending ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="arrow-up" size={24} color="white" />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    headerGradient: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    backButton: { padding: 5, marginRight: 10 },
    headerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    supportAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: BRAND_COLORS.blue + '40',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: BRAND_COLORS.blue + '60',
    },
    headerTitle: { color: 'white', fontSize: 16, fontWeight: '800' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    headerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
    
    chatContent: { padding: 15, paddingBottom: 30 },
    messageContainer: { flexDirection: 'row', alignItems: 'center', width: width + 60 },
    messageWrapper: { marginBottom: 12, width: width - 30, flexDirection: 'row' },
    userMessageWrapper: { justifyContent: 'flex-end' },
    adminMessageWrapper: { justifyContent: 'flex-start' },
    
    messageBubble: { 
        maxWidth: '85%', 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 20,
    },
    userBubble: { 
        backgroundColor: BRAND_COLORS.blue,
        borderBottomRightRadius: 4,
    },
    adminBubble: { 
        backgroundColor: '#262626',
        borderBottomLeftRadius: 4,
    },
    messageText: { color: 'white', fontSize: 15, lineHeight: 20 },
    
    hiddenTimeContainer: { width: 60, paddingLeft: 10 },
    hiddenTimeText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },

    inputWrapper: {
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
        paddingHorizontal: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 28,
        paddingLeft: 15,
        paddingRight: 5,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 15,
        maxHeight: 100,
        paddingVertical: 8,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    sendGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 }
});

export default TicketChatScreen;
