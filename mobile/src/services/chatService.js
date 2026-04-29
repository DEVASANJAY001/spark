import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, limit, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { userService } from './userService';
import { encryptionService } from './encryptionService';
import { ref as rtdbRef, set, onValue } from 'firebase/database';
import { rtdb } from '../firebase/config';

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
            where('users', 'array-contains', uid),
            where('hasMessages', '==', false)
        );
        return onSnapshot(q, async (snapshot) => {
            const matches = await Promise.all(snapshot.docs.map(async (matchDoc) => {
                const matchData = matchDoc.data();
                const otherUid = matchData.users.find(id => id !== uid);
                const profile = await chatService._hydrateProfile(otherUid);
                return { id: matchDoc.id, ...matchData, otherUser: profile };
            }));

            // Sort by createdAt desc in-memory
            matches.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            callback(matches);
        });
    },

    /**
     * Get active conversations (message list)
     * hasMessages: true
     */
    getConversations: (uid, callback) => {
        const q = query(
            collection(db, 'matches'),
            where('users', 'array-contains', uid),
            where('hasMessages', '==', true)
        );
        return onSnapshot(q, async (snapshot) => {
            const conversations = await Promise.all(snapshot.docs.map(async (matchDoc) => {
                const matchData = matchDoc.data();
                const otherUid = matchData.users.find(id => id !== uid);
                const profile = await chatService._hydrateProfile(otherUid);

                // Decrypt last message if key exists
                let lastMessage = matchData.lastMessage;
                if (matchData.sharedKey && lastMessage) {
                    lastMessage = encryptionService.decrypt(lastMessage, matchData.sharedKey);
                }

                return {
                    id: matchDoc.id,
                    ...matchData,
                    lastMessage,
                    otherUser: profile
                };
            }));

            // Sort by lastMessageAt desc in-memory
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

        let messageText = text;
        let isEncrypted = false;

        try {
            // Try encryption (graceful degradation if crypto fails)
            const matchSnap = await getDoc(matchRef);
            let sharedKey = matchSnap.data()?.sharedKey;

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
