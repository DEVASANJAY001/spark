import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, limit, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { userService } from './userService';
import { encryptionService } from './encryptionService';
import { ref as rtdbRef, set, onValue } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { notificationService } from './notificationService';

export const chatService = {
    /**
     * Hydrate a profile with RTDB + Firestore fallback
     */
    _hydrateProfile: async (uid) => {
        let profile = null;
        try {
            profile = await userService.getProfile(uid);
        } catch (e) {
            console.warn('RTDB hydration failed for chat user', uid);
        }
        if (!profile || !profile.firstName) {
            try {
                const userDocRef = doc(db, 'users', uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    profile = { ...userDocSnap.data(), ...(profile || {}) };
                }
            } catch (e) {
                console.warn('Firestore fallback also failed for', uid);
            }
        }
        return profile || { firstName: 'Unknown', photos: ['https://picsum.photos/100'] };
    },

    /**
     * Get new matches (horizontal scroll row)
     * hasMessages: false
     */
    getNewMatches: (uid, callback) => {
        const q = query(
            collection(db, 'matches'),
            where('users', 'array-contains', uid)
        );
        return onSnapshot(q, async (snapshot) => {
            const hydrated = await Promise.all(snapshot.docs.map(async (matchDoc) => {
                const matchData = matchDoc.data();
                const otherUid = matchData.users.find(id => id !== uid);
                const profile = await chatService._hydrateProfile(otherUid);
                return { id: matchDoc.id, ...matchData, otherUser: profile };
            }));

            // Filter for new matches: must NOT have messages AND must have the newMatch flag
            const matches = hydrated.filter(m => !m.hasMessages && !m.lastMessage && m.newMatch !== false);

            // Sort by createdAt desc
            matches.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            callback(matches);
        });
    },

    /**
     * Get the current count of active conversations for a user
     */
    getActiveConversationCount: async (uid) => {
        const { getDocs } = await import('firebase/firestore');
        const q = query(
            collection(db, 'matches'),
            where('users', 'array-contains', uid)
        );
        const snapshot = await getDocs(q);
        // An active conversation is one with hasMessages: true OR lastMessage existing
        return snapshot.docs.filter(doc => {
            const data = doc.data();
            return data.hasMessages === true || data.lastMessage || data.lastMessageAt;
        }).length;
    },

    /**
     * Check if a user can start a new conversation thread
     */
    canStartNewChat: async (uid, tier) => {
        const count = await chatService.getActiveConversationCount(uid);
        const limit = userService.getChatLimit(tier);
        return count < limit;
    },

    /**
     * Get active conversations (message list)
     * Shows matches that have at least one message or the hasMessages flag set
     */
    getConversations: (uid, callback) => {
        const q = query(
            collection(db, 'matches'),
            where('users', 'array-contains', uid)
        );
        return onSnapshot(q, async (snapshot) => {
            const hydrated = await Promise.all(snapshot.docs.map(async (matchDoc) => {
                const matchData = matchDoc.data();
                const otherUid = matchData.users.find(id => id !== uid);
                const profile = await chatService._hydrateProfile(otherUid);

                // Decrypt last message if key exists
                let lastMessage = matchData.lastMessage;
                if (matchData.sharedKey && lastMessage) {
                    try {
                        lastMessage = encryptionService.decrypt(lastMessage, matchData.sharedKey);
                    } catch (e) {
                        console.warn('Decryption failed for last message');
                    }
                }

                // High-Reliability Fallback: If lastMessage is missing but we have a timestamp, 
                // try to fetch the actual last message from the subcollection.
                let displayTime = matchData.lastMessageAt;
                if (!lastMessage && matchData.lastMessageAt) {
                    try {
                        const { getDocs, query, collection, orderBy, limit } = await import('firebase/firestore');
                        const lastMsgQ = query(
                            collection(db, 'matches', matchDoc.id, 'messages'),
                            orderBy('createdAt', 'desc'),
                            limit(1)
                        );
                        const lastMsgSnap = await getDocs(lastMsgQ);
                        if (!lastMsgSnap.empty) {
                            const lastMsgData = lastMsgSnap.docs[0].data();
                            lastMessage = lastMsgData.text;
                            displayTime = lastMsgData.createdAt || matchData.lastMessageAt;
                            if (lastMsgData.isEncrypted && matchData.sharedKey) {
                                lastMessage = encryptionService.decrypt(lastMessage, matchData.sharedKey);
                            }
                        }
                    } catch (err) {
                        console.warn('Failed to fetch fallback last message:', err);
                    }
                }

                const displayMessage = lastMessage || (matchData.hasMessages ? 'Sent a message' : 'New connection');

                return {
                    id: matchDoc.id,
                    ...matchData,
                    lastMessage: displayMessage,
                    lastMessageAt: displayTime,
                    otherUser: profile
                };
            }));

            // Filter for active conversations: must have messages OR hasMessages flag
            const conversations = hydrated.filter(m => m.hasMessages === true || m.lastMessage || m.lastMessageAt);

            // Sort by lastMessageAt desc
            conversations.sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0));

            callback(conversations);
        });
    },

    /**
     * Get messages for a match (real-time listener)
     */
    listenMessages: (matchId, callback) => {
        const q = query(
            collection(db, 'matches', matchId, 'messages'),
            orderBy('createdAt', 'desc')
        );

        const matchRef = doc(db, 'matches', matchId);

        return onSnapshot(q, async (snapshot) => {
            // Get shared key for decryption
            const matchSnap = await getDoc(matchRef);
            const sharedKey = matchSnap.data()?.sharedKey;

            const messages = snapshot.docs.map(doc => {
                const data = doc.data();
                let text = data.text;

                if (data.isEncrypted && sharedKey) {
                    text = encryptionService.decrypt(text, sharedKey);
                }

                // Handle "Delete for Everyone"
                if (data.isDeleted) {
                    text = '🚫 This message was deleted';
                }

                return { id: doc.id, ...data, text };
            });
            callback(messages);
        });
    },

    /**
     * Send a message and update match metadata
     */
    sendMessage: async (matchId, senderId, text, mediaUrl = null, replyTo = null) => {
        const messagesRef = collection(db, 'matches', matchId, 'messages');
        const matchRef = doc(db, 'matches', matchId);
        const timestamp = serverTimestamp();

        // 1. Ensure match document exists (Crucial for Super Like direct chat)
        const matchSnap = await getDoc(matchRef);
        if (!matchSnap.exists()) {
            const uids = matchId.split('_');
            await setDoc(matchRef, {
                users: uids,
                createdAt: timestamp,
                hasMessages: true,
                newMatch: false,
                lastMessage: text, // Temporarily set plaintext, updated below
                lastMessageAt: timestamp,
            });
        }

        let messageText = text;
        let isEncrypted = false;
        let sharedKey = matchSnap.exists() ? matchSnap.data()?.sharedKey : null;

        try {
            // Try encryption (graceful degradation if crypto fails)
            if (!sharedKey) {
                sharedKey = encryptionService.generateKey();
                await updateDoc(matchRef, { sharedKey });
            }

            const encrypted = encryptionService.encrypt(text, sharedKey);
            if (encrypted && encrypted !== text) {
                messageText = encrypted;
                isEncrypted = true;
            }
        } catch (cryptoErr) {
            console.warn('⚠️ Encryption skipped, sending plaintext:', cryptoErr.message);
        }

        await addDoc(messagesRef, {
            senderId,
            text: messageText,
            mediaUrl,
            replyTo,
            createdAt: timestamp,
            readBy: [senderId],
            isEncrypted
        });

        await updateDoc(matchRef, {
            lastMessage: messageText,
            lastMessageAt: timestamp,
            hasMessages: true,
            newMatch: false,
            unreadBy: []
        });

        // 4. Send Push Notification to recipient
        try {
            const recipientId = matchId.split('_').find(id => id !== senderId);
            const [recipientProfile, senderProfile] = await Promise.all([
                chatService._hydrateProfile(recipientId),
                chatService._hydrateProfile(senderId)
            ]);

            if (recipientProfile?.expoPushToken) {
                await notificationService.sendPushNotification(
                    recipientProfile.expoPushToken,
                    senderProfile?.firstName || 'New Message',
                    text,
                    { matchId, type: 'chat' }
                );
            }
        } catch (error) {
            console.error('[ChatService] Notification trigger failed:', error);
        }
    },

    /**
     * Toggle or update a reaction on a message
     */
    toggleReaction: async (matchId, messageId, uid, emoji) => {
        try {
            const messageRef = doc(db, 'matches', matchId, 'messages', messageId);
            const messageSnap = await getDoc(messageRef);
            if (!messageSnap.exists()) return;
            
            const data = messageSnap.data();
            const reactions = data.reactions || {};
            
            // Toggle the emoji for this user
            if (reactions[uid] === emoji) {
                delete reactions[uid]; // Remove if same emoji
            } else {
                reactions[uid] = emoji; // Set/update emoji
            }
            
            await updateDoc(messageRef, { reactions });
        } catch (error) {
            console.error('[ChatService] Toggle reaction failed:', error);
            throw error;
        }
    },

    /**
     * Mark all messages in a conversation as read
     */
    markAsRead: async (matchId, uid) => {
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, {
            unread: false // Simplified unread state
        });
    },

    /**
     * Set typing status for a match
     */
    setTypingStatus: (matchId, uid, isTyping) => {
        const typingRef = rtdbRef(rtdb, `typing/${matchId}/${uid}`);
        set(typingRef, isTyping);
    },

    /**
     * Subscribe to typing status of other user in a match
     */
    subscribeToTypingStatus: (matchId, otherUid, callback) => {
        const typingRef = rtdbRef(rtdb, `typing/${matchId}/${otherUid}`);
        return onValue(typingRef, (snapshot) => {
            callback(snapshot.val() || false);
        });
    },

    /**
     * Edit a message
     */
    editMessage: async (matchId, messageId, newText) => {
        const messageRef = doc(db, 'matches', matchId, 'messages', messageId);
        const matchRef = doc(db, 'matches', matchId);
        
        // Encrypt if needed
        let encryptedText = newText;
        try {
            const matchSnap = await getDoc(matchRef);
            const sharedKey = matchSnap.data()?.sharedKey;
            if (sharedKey) {
                encryptedText = encryptionService.encrypt(newText, sharedKey);
            }
        } catch (e) {
            console.warn('Edit encryption failed:', e);
        }

        await updateDoc(messageRef, {
            text: encryptedText,
            isEdited: true,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Delete a message
     */
    deleteMessage: async (matchId, messageId, mode, uid) => {
        const messageRef = doc(db, 'matches', matchId, 'messages', messageId);
        
        if (mode === 'everyone') {
            await updateDoc(messageRef, {
                isDeleted: true,
                text: 'This message was deleted',
                mediaUrl: null,
                updatedAt: serverTimestamp()
            });
        } else {
            // "Delete for me" - track in deletedBy array
            const { arrayUnion } = await import('firebase/firestore');
            await updateDoc(messageRef, {
                deletedBy: arrayUnion(uid)
            });
        }
    }
};
