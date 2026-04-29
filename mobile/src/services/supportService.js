import { db } from '../firebase/config';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';

export const supportService = {
    createTicket: async (uid, email, subject, message, category = 'General') => {
        const ticketData = {
            uid,
            email,
            subject,
            message,
            category,
            status: 'open',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            replies: []
        };
        return await addDoc(collection(db, 'tickets'), ticketData);
    },

    getUserTickets: (uid, callback) => {
        const q = query(
            collection(db, 'tickets'),
            where('uid', '==', uid)
        );
        return onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Sort by createdAt descending manually to avoid needing a Firestore Index
            tickets.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || 0);
                return dateB - dateA;
            });

            callback(tickets);
        });
    },

    sendReply: async (ticketId, message, sender = 'User') => {
        const ticketRef = doc(db, 'tickets', ticketId);
        return await updateDoc(ticketRef, {
            replies: arrayUnion({
                message,
                sender,
                timestamp: new Date().toISOString()
            }),
            status: sender === 'Admin' ? 'responded' : 'open',
            updatedAt: serverTimestamp()
        });
    }
};
