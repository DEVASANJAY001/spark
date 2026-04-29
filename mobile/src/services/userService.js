import { doc, setDoc, updateDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref as rtdbRef, get, set, update, onValue } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { deleteUser } from 'firebase/auth';
import { db, storage, rtdb } from '../firebase/config';
import { storageService } from './storageService';

export const userService = {
    /**
     * Create or update a user profile
     * Writes to both RTDB (Full Profile) and Firestore (Discovery Index)
     */
    saveProfile: async (uid, data) => {
        try {
            // 1. Update Realtime Database (Primary Source of Truth)
            const profileRef = rtdbRef(rtdb, `users/${uid}/profile`);
            await update(profileRef, {
                ...data,
                updatedAt: Date.now(),
            });

            // 2. Update Firestore (Discovery Index)
            // Only store indexable/discovery fields in Firestore to keep it lightweight
            const discoveryFields = [
                'firstName', 'birthday', 'gender', 'interestedIn',
                'lookingFor', 'city', 'isProfileComplete', 'premiumTier',
                'locationEnabled', 'username', 'photos'
            ];
            const discoveryData = {};
            discoveryFields.forEach(field => {
                if (data[field] !== undefined) discoveryData[field] = data[field];
            });

            // Always sync completion status
            const fullProfile = await userService.getProfile(uid);
            discoveryData.profileCompletion = userService.calculateCompletion(fullProfile);

            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, {
                ...discoveryData,
                uid,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            console.log(`✅ Profile updated in both Firestore and RTDB for ${uid}`);
        } catch (error) {
            console.error('Error in saveProfile:', error);
            throw error;
        }
    },

    /**
     * Mark a profile as complete
     */
    completeProfile: async (uid) => {
        await userService.saveProfile(uid, { isProfileComplete: true });
    },

    /**
     * Get a user profile (Primarily from RTDB)
     */
    getProfile: async (uid) => {
        try {
            const profileRef = rtdbRef(rtdb, `users/${uid}/profile`);
            const photosRef = rtdbRef(rtdb, `users/${uid}/photos`);

            // Fetch profile and photos in parallel
            const [snapshot, photoSnap] = await Promise.all([
                get(profileRef),
                get(photosRef)
            ]);

            if (snapshot.exists()) {
                const userData = snapshot.val();

                // Hydrate photos if they exist
                if (photoSnap.exists()) {
                    const rtdbPhotos = photoSnap.val();
                    const mergedPhotos = [];
                    for (let i = 0; i < 9; i++) {
                        if (rtdbPhotos[`photo_${i}`]) mergedPhotos.push(rtdbPhotos[`photo_${i}`]);
                    }
                    userData.photos = mergedPhotos;
                }

                return userData;
            }

            // Fallback to Firestore if RTDB is empty
            const userRef = doc(db, 'users', uid);
            const docSnap = await getDoc(userRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error('Error in getProfile:', error);
            return null;
        }
    },

    /**
     * Auto-save a single field to RTDB and eventually sync to Firestore
     */
    updateProfileField: async (uid, field, value) => {
        try {
            const profileRef = rtdbRef(rtdb, `users/${uid}/profile`);
            await update(profileRef, {
                [field]: value,
                updatedAt: Date.now()
            });

            // Secondary sync to Firestore for indexed fields
            const discoveryFields = ['firstName', 'birthday', 'gender', 'interestedIn', 'lookingFor', 'city'];
            if (discoveryFields.includes(field)) {
                const userRef = doc(db, 'users', uid);
                await updateDoc(userRef, {
                    [field]: value,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error(`Error auto-saving field ${field}:`, error);
        }
    },

    /**
     * Upload photo using storageService (RTDB Primary)
     */
    uploadPhoto: async (uid, uri, index) => {
        try {
            const result = await storageService.uploadAvatar(uid, uri, index);
            return result.url;
        } catch (error) {
            console.error('Error in uploadPhoto:', error);
            throw error;
        }
    },

    /**
     * Remove photo from RTDB
     */
    removePhoto: async (uid, index) => {
        try {
            const photoRef = rtdbRef(rtdb, `users/${uid}/photos/photo_${index}`);
            await set(photoRef, null);
            console.log(`✅ Photo ${index} removed from RTDB for ${uid}`);

            // Update completion status in Firestore
            const fullProfile = await userService.getProfile(uid);
            const completion = userService.calculateCompletion(fullProfile);
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                profileCompletion: completion,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error in removePhoto:', error);
            throw error;
        }
    },

    /**
     * Calculate profile completion percentage
     */
    calculateCompletion: (profile) => {
        if (!profile) return 0;
        const fields = [
            'firstName', 'birthday', 'gender', 'interestedIn',
            'lookingFor', 'photos', 'bio'
        ];
        let filled = 0;
        fields.forEach(field => {
            if (profile[field]) {
                if (Array.isArray(profile[field])) {
                    if (profile[field].length > 0) filled++;
                } else if (typeof profile[field] === 'string' && profile[field].trim() !== '') {
                    filled++;
                } else if (profile[field]) {
                    filled++;
                }
            }
        });
        return Math.round((filled / fields.length) * 100);
    },

    /**
     * Delete user account
     */
    /**
     * Delete user account and all associated data (Full Wipe)
     */
    deleteAccount: async (auth, user) => {
        try {
            const uid = user.uid;

            // 1. Cleanup Matches and Messages in Firestore
            const { collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
            const matchesRef = collection(db, 'matches');
            const q = query(matchesRef, where('users', 'array-contains', uid));
            const matchSnapshot = await getDocs(q);

            const batch = writeBatch(db);

            for (const matchDoc of matchSnapshot.docs) {
                const matchId = matchDoc.id;

                // Get messages subcollection
                const messagesRef = collection(db, 'matches', matchId, 'messages');
                const messageSnapshot = await getDocs(messagesRef);

                // Add message deletions to batch
                messageSnapshot.forEach(msgDoc => {
                    batch.delete(msgDoc.ref);
                });

                // Add match deletion to batch
                batch.delete(matchDoc.ref);
            }

            // 2. Delete Firestore User Entry
            const userRef = doc(db, 'users', uid);
            batch.delete(userRef);

            // Commit all Firestore deletions
            await batch.commit();

            // 3. Delete RTDB User Data
            const rtdbUserRef = rtdbRef(rtdb, `users/${uid}`);
            await set(rtdbUserRef, null);

            // 4. Delete Auth User (Crucial: must be last or authenticated context lost)
            await deleteUser(user);

            console.log(`🗑️ Full account wipe completed for ${uid}`);
            return true;
        } catch (error) {
            console.error('Error in deep deleteAccount:', error);
            if (error.code === 'auth/requires-recent-login') {
                throw new Error('re-authenticate');
            }
            throw error;
        }
    },

    /**
     * Check if a username is available
     */
    checkUsernameAvailability: async (username) => {
        if (!username || username.length < 3) return false;
        const normalized = username.toLowerCase().trim();
        const usernameRef = doc(db, 'usernames', normalized);
        const docSnap = await getDoc(usernameRef);
        return !docSnap.exists();
    },

    /**
     * Set a unique username
     */
    setUsername: async (uid, username) => {
        const normalized = username.toLowerCase().trim();
        const usernameRef = doc(db, 'usernames', normalized);
        const userRef = doc(db, 'users', uid);

        // This should ideally be a transaction
        const { runTransaction } = await import('firebase/firestore');
        try {
            await runTransaction(db, async (transaction) => {
                const usernameSnap = await transaction.get(usernameRef);
                if (usernameSnap.exists() && usernameSnap.data().uid !== uid) {
                    throw new Error('Username already taken');
                }

                // Check if user already has a username to release the old one
                const userSnap = await transaction.get(userRef);
                const oldUsername = userSnap.data()?.username;
                if (oldUsername && oldUsername.toLowerCase() !== normalized) {
                    const oldUsernameRef = doc(db, 'usernames', oldUsername.toLowerCase());
                    transaction.delete(oldUsernameRef);
                }

                transaction.set(usernameRef, { uid });
                transaction.update(userRef, { username: normalized });

                // Also update RTDB
                const profileRef = rtdbRef(rtdb, `users/${uid}/profile`);
                await update(profileRef, { username: normalized });
            });
            return true;
        } catch (error) {
            console.error('Error setting username:', error);
            throw error;
        }
    },

    /**
     * Subscribe to profile changes (RTDB)
     */
    subscribeToProfile: (uid, callback) => {
        const profileRef = rtdbRef(rtdb, `users/${uid}/profile`);
        const photosRef = rtdbRef(rtdb, `users/${uid}/photos`);

        // Listen for profile data
        const unsubscribeProfile = onValue(profileRef, async (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                
                // For a complete profile object, we need to fetch photos too
                // We'll trigger a separate fetch for photos to keep it hydrated
                // or just wait for the next callback if photos are updated separately.
                // However, usually we want the merged object.
                const photoSnap = await get(photosRef);
                if (photoSnap.exists()) {
                    const rtdbPhotos = photoSnap.val();
                    const mergedPhotos = [];
                    for (let i = 0; i < 9; i++) {
                        if (rtdbPhotos[`photo_${i}`]) mergedPhotos.push(rtdbPhotos[`photo_${i}`]);
                    }
                    userData.photos = mergedPhotos;
                }
                
                callback(userData);
            }
        });

        return unsubscribeProfile;
    }
};
