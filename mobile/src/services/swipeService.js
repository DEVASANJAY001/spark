import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc, serverTimestamp, onSnapshot, limit, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { userService } from './userService';

const calculateAge = (birthday) => {
    if (!birthday) return null;
    
    let birthDate;
    if (typeof birthday === 'string' && birthday.includes('/')) {
        const [d, m, y] = birthday.split('/');
        birthDate = new Date(y, m - 1, d);
    } else {
        birthDate = new Date(birthday);
    }

    if (isNaN(birthDate.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
    return age;
};

export const swipeService = {
    /**
     * Get potential matches for a user
     */
    getPotentialMatches: async (uid, interestedIn, gender, filters = {}) => {
        try {
            const {
                maxDistance = 50,
                ageRange = [18, 50],
                minPhotos = 1,
                userLocation = null,
                showFurtherAway = false,
                interests = [],
                lookingFor = [],
            } = filters;

            // 1. Get already swiped users (42-day cooldown)
            const swipesRef = collection(db, 'users', uid, 'swipes');
            const swipesSnapshot = await getDocs(swipesRef);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 42);

            const swipedUids = swipesSnapshot.docs
                .filter(doc => {
                    const data = doc.data();
                    const ts = data.timestamp?.toDate?.();
                    return ts ? ts > cutoff : true;
                })
                .map(doc => doc.id);
            swipedUids.push(uid);

            // 2. Fetch potential matches
            const usersRef = collection(db, 'users');
            let q;

            const baseConstraints = [where('isProfileComplete', '==', true)];
            
            if (interestedIn !== 'Everyone') {
                const targetGender = interestedIn === 'Women' ? 'Woman' : 'Man';
                baseConstraints.push(where('gender', '==', targetGender));
            }

            q = query(usersRef, ...baseConstraints, limit(100));
            const querySnapshot = await getDocs(q);

            // 3. Filter and Hydrate
            const fetchPromises = querySnapshot.docs
                .filter(doc => !swipedUids.includes(doc.id))
                .map(async (userDoc) => {
                    const firestoreData = userDoc.data();
                    let profile = null;
                    try {
                        profile = await userService.getProfile(userDoc.id);
                    } catch (e) {
                        console.warn('RTDB hydration failed for', userDoc.id);
                    }

                    const data = { id: userDoc.id, ...firestoreData, ...profile };
                    
                    // Filter: Min Photos
                    const photos = data.photos?.filter(p => p) || [];
                    if (photos.length < minPhotos) return null;

                    // Filter: Age Range
                    const age = data.age || calculateAge(data.birthday) || 21;
                    if (age < ageRange[0] || age > ageRange[1]) return null;

                    // Filter: Distance
                    if (userLocation && data.location) {
                        const distance = userService.calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            data.location.latitude,
                            data.location.longitude
                        );
                        data.distance = distance;
                        if (!showFurtherAway && distance > maxDistance) return null;
                    }

                    // Filter: Interests (if specified)
                    if (interests.length > 0) {
                        const hasInterest = interests.some(i => data.interests?.includes(i));
                        if (!hasInterest) return null;
                    }

                    return { ...data, age, photos };
                });

            let results = (await Promise.all(fetchPromises)).filter(r => r !== null);

            // 4. Shuffle first, then float boosted profiles to the top
            for (let i = results.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [results[i], results[j]] = [results[j], results[i]];
            }

            // Boosted profiles (within 500-1000 KM, actively boosted) get priority
            const now = Date.now();
            results.sort((a, b) => {
                const aBoosted = a.boostExpiresAt && a.boostExpiresAt > now && (a.distance == null || a.distance <= 1000);
                const bBoosted = b.boostExpiresAt && b.boostExpiresAt > now && (b.distance == null || b.distance <= 1000);
                if (aBoosted && !bBoosted) return -1;
                if (!aBoosted && bBoosted) return 1;
                return 0;
            });

            return results;
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

            // Also reset daily swipe count in Firestore
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                dailySwipeCount: 0,
                lastSwipeDate: new Date().toISOString().split('T')[0]
            });

            return true;
        } catch (error) {
            console.error('Error resetting swipes:', error);
            throw error;
        }
    },

    /**
     * Activate a 20-minute profile boost
     */
    activateBoost: async (uid) => {
        try {
            const boostExpiresAt = Date.now() + 20 * 60 * 1000; // 20 minutes from now
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, { boostExpiresAt });
            console.log(`[SwipeService] Boost activated for ${uid}, expires at ${new Date(boostExpiresAt).toISOString()}`);
            return boostExpiresAt;
        } catch (error) {
            console.error('Error activating boost:', error);
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
                    age: profile?.age || (profile?.birthday ? calculateAge(profile?.birthday) : null),
                    ...profile,
                    likedAt: likeData.timestamp,
                    type: likeData.type,
                    swipeType: likeData.type, // used by LikeCard for badge detection
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
    },

    /**
     * Get Top Picks for a user
     */
    getTopPicks: async (uid, interestedIn) => {
        try {
            // 1. Get already swiped users to exclude them
            const swipesRef = collection(db, 'users', uid, 'swipes');
            const swipesSnapshot = await getDocs(swipesRef);
            const swipedUids = swipesSnapshot.docs.map(doc => doc.id);
            swipedUids.push(uid);

            // 2. Query for top profiles
            const usersRef = collection(db, 'users');
            let q;
            
            if (interestedIn === 'Everyone') {
                q = query(usersRef, 
                    where('isProfileComplete', '==', true),
                    limit(50)
                );
            } else {
                const targetGender = interestedIn === 'Women' ? 'Woman' : 'Man';
                q = query(usersRef,
                    where('isProfileComplete', '==', true),
                    where('gender', '==', targetGender),
                    limit(50)
                );
            }

            const querySnapshot = await getDocs(q);
            
            // 3. Filter and Sort In-Memory (to avoid index requirements)
            let availableDocs = querySnapshot.docs
                .filter(doc => !swipedUids.includes(doc.id))
                .sort((a, b) => (b.data().profileCompletion || 0) - (a.data().profileCompletion || 0))
                .slice(0, 10);
            
            let results = await Promise.all(availableDocs.map(async (userDoc) => {
                const firestoreData = userDoc.data();
                try {
                    const rtdbProfile = await userService.getProfile(userDoc.id);
                    return { 
                        id: userDoc.id, 
                        uid: userDoc.id,
                        ...firestoreData, 
                        ...rtdbProfile,
                        age: rtdbProfile?.age || calculateAge(rtdbProfile?.birthday) || 21,
                        expiresAt: '24h left' // Placeholder for UI
                    };
                } catch (e) {
                    return {
                        id: userDoc.id,
                        uid: userDoc.id,
                        ...firestoreData,
                        age: calculateAge(firestoreData.birthday) || 21,
                        photos: firestoreData.photos || ['https://picsum.photos/400'],
                        expiresAt: '24h left'
                    };
                }
            }));

            // Shuffle top picks
            for (let i = results.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [results[i], results[j]] = [results[j], results[i]];
            }

            return results;
        } catch (error) {
            console.error('Error getting top picks:', error);
            return [];
        }
    }
};
