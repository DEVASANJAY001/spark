import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import useAuth from '../../hooks/useAuth';
import { supportService } from '../../services/supportService';
import { db } from '../../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

const TicketChatScreen = ({ route, navigation }) => {
    const { ticket: initialTicket } = route.params;
    const { user } = useAuth();
    const [ticket, setTicket] = useState(initialTicket);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef();

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
        return (
            <View style={[styles.messageWrapper, isUser ? styles.userMessageWrapper : styles.adminMessageWrapper]}>
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.adminBubble]}>
                    <Text style={styles.messageText}>{item.message}</Text>
                    <Text style={styles.messageTime}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{ticket.subject}</Text>
                    <Text style={styles.headerSubtitle}>{ticket.status.toUpperCase()}</Text>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={allMessages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#666"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!message.trim() || sending}
                    >
                        {sending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={20} color="white" />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#222'
    },
    backButton: { padding: 5 },
    headerTitleContainer: { marginLeft: 15, flex: 1 },
    headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    headerSubtitle: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold', marginTop: 2 },
    chatContent: { padding: SPACING.m, paddingBottom: 20 },
    messageWrapper: { marginBottom: 15, width: '100%', flexDirection: 'row' },
    userMessageWrapper: { justifyContent: 'flex-end' },
    adminMessageWrapper: { justifyContent: 'flex-start' },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 18 },
    userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
    adminBubble: { backgroundColor: '#222', borderBottomLeftRadius: 4 },
    messageText: { color: 'white', fontSize: 15, lineHeight: 20 },
    messageTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 5, textAlign: 'right' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#111',
        borderTopWidth: 1,
        borderTopColor: '#222'
    },
    input: {
        flex: 1,
        backgroundColor: '#222',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        color: 'white',
        maxHeight: 100,
        marginRight: 10
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendBtnDisabled: {
        backgroundColor: '#333'
    }
});

export default TicketChatScreen;
