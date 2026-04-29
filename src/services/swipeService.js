import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc, serverTimestamp, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { userService } from './userService';

const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
};

export const swipeService = {
    /**
     * Get potential matches for a user
     */
    getPotentialMatches: async (uid, interestedIn, gender) => {
        try {
            // 1. Get already swiped users (likes/passes/superlikes)
            const swipesRef = collection(db, 'users', uid, 'swipes');
            const swipesSnapshot = await getDocs(swipesRef);
            const swipedUids = swipesSnapshot.docs.map(doc => doc.id);
            swipedUids.push(uid); // Exclude self

            // 2. Fetch potential matches
            const usersRef = collection(db, 'users');
            let q;

            if (interestedIn === 'Everyone') {
                q = query(usersRef, where('isProfileComplete', '==', true), limit(50));
            } else {
                const targetGender = interestedIn === 'Women' ? 'Woman' : 'Man';
                q = query(usersRef,
                    where('isProfileComplete', '==', true),
                    where('gender', '==', targetGender),
                    limit(50)
                );
            }

            const querySnapshot = await getDocs(q);

            // 3. Filter out already swiped users
            const availableDocs = querySnapshot.docs.filter(doc => !swipedUids.includes(doc.id));

            // 4. Hydrate profiles from RTDB (fallback to Firestore data if RTDB fails)
            const fetchPromises = availableDocs
                .map(async (userDoc) => {
                    const firestoreData = userDoc.data();
                    try {
                        const rtdbProfile = await userService.getProfile(userDoc.id);
                        if (rtdbProfile) {
                            return { id: userDoc.id, ...firestoreData, ...rtdbProfile };
                        }
                    } catch (e) {
                        // RTDB permission denied — use Firestore data as fallback
                        console.warn('RTDB hydration failed for', userDoc.id, '- using Firestore fallback');
                    }
                    // Fallback: return Firestore data with a placeholder photo if needed
                    return {
                        id: userDoc.id,
                        ...firestoreData,
                        photos: firestoreData.photos || ['https://picsum.photos/400'],
                    };
                });

            const results = await Promise.all(fetchPromises);
            return results.filter(r => r !== null);
        } catch (error) {
            console.error('Error getting potential matches:', error);
            return [];
        }
    },

    /**
     * Reset all swipes for a user (Development Tool)
     */
    resetSwipes: async (uid) => {
        try {
            const swipesRef = collection(db, 'users', uid, 'swipes');
            const snapshot = await getDocs(swipesRef);

            const deleteRealPromises = snapshot.docs.map(swipeDoc => deleteDoc(swipeDoc.ref));
            await Promise.all(deleteRealPromises);
            return true;
        } catch (error) {
            console.error('Error resetting swipes:', error);
            throw error;
        }
    },

    /**
     * Handle a swipe action
     */
    handleSwipe: async (currentUid, targetUid, type) => {
        try {
            // 1. Record the swipe
            const swipeRef = doc(db, 'users', currentUid, 'swipes', targetUid);
            try {
                await setDoc(swipeRef, {
                    type,
                    timestamp: serverTimestamp()
                });
            } catch (e) {
                console.error(`[handleSwipe] Failed to record swipe on users/${currentUid}/swipes/${targetUid}:`, e);
                throw e;
            }

            if (type === 'like' || type === 'superlike') {
                // 2. Add to target user's likes collection
                const likeRef = doc(db, 'users', targetUid, 'likes', currentUid);
                try {
                    await setDoc(likeRef, {
                        type,
                        timestamp: serverTimestamp(),
                        fromUid: currentUid
                    });
                } catch (e) {
                    console.error(`[handleSwipe] Failed to write like on users/${targetUid}/likes/${currentUid}:`, e);
                    throw e;
                }

                // 3. Check for mutual match
                const targetSwipeRef = doc(db, 'users', targetUid, 'swipes', currentUid);
                let targetSwipeSnap;
                try {
                    targetSwipeSnap = await getDoc(targetSwipeRef);
                } catch (e) {
                    console.error(`[handleSwipe] Failed to read target user's swipe from users/${targetUid}/swipes/${currentUid}:`, e);
                    // We might not want to throw here if we still want to record the like,
                    // but for debugging it's helpful.
                    throw e;
                }

                if (targetSwipeSnap.exists() && (targetSwipeSnap.data().type === 'like' || targetSwipeSnap.data().type === 'superlike')) {
                    // 4. Create match document
                    const matchId = [currentUid, targetUid].sort().join('_');
                    const matchRef = doc(db, 'matches', matchId);
                    try {
                        await setDoc(matchRef, {
                            users: [currentUid, targetUid],
                            createdAt: serverTimestamp(),
                            hasMessages: false,
                            newMatch: true,
                            lastMessage: null,
                            lastMessageAt: serverTimestamp(),
                        });
                    } catch (e) {
                        console.error(`[handleSwipe] Failed to create match document in /matches/${matchId}:`, e);
                        throw e;
                    }
                    return { isMatch: true, targetUid };
                }
            }
            return { isMatch: false };
        } catch (error) {
            console.error('Error handling swipe (top level):', error);
            throw error;
        }
    },

    /**
     * Listen to people who liked the current user
     */
    getLikes: (uid, callback) => {
        const likesRef = collection(db, 'users', uid, 'likes');
        const q = query(likesRef, orderBy('timestamp', 'desc'), limit(50));

        return onSnapshot(q, async (snapshot) => {
            const likesCount = snapshot.size;
            const likesPromises = snapshot.docs.map(async (likeDoc) => {
                const likeData = likeDoc.data();
                const fromUid = likeData.fromUid || likeDoc.id;

                // Try RTDB first, fallback to Firestore
                let profile = null;
                try {
                    profile = await userService.getProfile(fromUid);
                } catch (e) {
                    console.warn('RTDB hydration failed for like from', fromUid);
                }

                // Fallback to Firestore user doc
                if (!profile || !profile.firstName) {
                    try {
                        const userDocRef = doc(db, 'users', fromUid);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            profile = { ...userDocSnap.data(), ...(profile || {}) };
                        }
                    } catch (e) {
                        console.warn('Firestore fallback failed for', fromUid);
                    }
                }

                return {
                    id: likeDoc.id,
                    uid: fromUid,
                    firstName: profile?.firstName || 'Someone',
                    photos: profile?.photos || ['https://picsum.photos/400'],
                    age: profile?.age || profile?.birthday ? calculateAge(profile?.birthday) : null,
                    ...profile,
                    likedAt: likeData.timestamp,
                    type: likeData.type
                };
            });
            const hydratedLikes = await Promise.all(likesPromises);
            callback({ likes: hydratedLikes, count: likesCount });
        });
    },

    /**
     * Listen to matches for the current user
     */
    getMatches: (uid, callback) => {
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('users', 'array-contains', uid), orderBy('lastMessageAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const matchedUids = new Set();
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const otherUid = data.users.find(id => id !== uid);
                if (otherUid) matchedUids.add(otherUid);
            });
            callback(matchedUids);
        });
    }
};
