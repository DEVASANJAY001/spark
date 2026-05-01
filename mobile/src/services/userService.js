import { doc, setDoc, updateDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref as rtdbRef, get, set, update, onValue } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { deleteUser } from 'firebase/auth';
import { db, storage, rtdb } from '../firebase/config';
import { storageService } from './storageService';

// Performance caches
const planCache = new Map();
const userProfileCache = new Map();

const isBase64 = (str) => {
    if (typeof str !== 'string') return false;
    return str.startsWith('data:image') || str.length > 1000; // Heuristic for base64
};

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
                'hasPremium', 'locationEnabled', 'username', 'photos',
                'selectedCategory', 'bio', 'jobTitle', 'company', 'height',
                'pronouns', 'prompts', 'quizzes'
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

            console.log(`[UserService] ✅ Profile sync complete for ${uid}. New Tier: ${discoveryData.premiumTier}`);
        } catch (error) {
            console.error('[UserService] ❌ Error in saveProfile:', error);
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
        // 0. Check cache first
        if (userProfileCache.has(uid)) {
            return userProfileCache.get(uid);
        }

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
                const mergedPhotos = new Array(9).fill(null);
                if (photoSnap.exists()) {
                    const rtdbPhotos = photoSnap.val();
                    for (let i = 0; i < 9; i++) {
                        if (rtdbPhotos[`photo_${i}`]) {
                            mergedPhotos[i] = rtdbPhotos[`photo_${i}`];
                        }
                    }
                }
                userData.photos = mergedPhotos;
                userData.uid = uid;

                // Dynamically fetch and sync premium features from the 'plans' collection
                if (userData.premiumTier) {
                    const tierKey = userData.premiumTier.toLowerCase();
                    
                    // Check plan cache
                    if (planCache.has(tierKey)) {
                        userData.premiumFeatures = planCache.get(tierKey);
                    } else {
                        try {
                            const planRef = doc(db, 'plans', tierKey);
                            const planSnap = await getDoc(planRef);
                            if (planSnap.exists()) {
                                const features = planSnap.data().features || [];
                                userData.premiumFeatures = features;
                                planCache.set(tierKey, features);
                            }
                        } catch (err) {
                            console.error('[UserService] Error syncing plan features:', err);
                        }
                    }
                }

                // Cache the successfully hydrated profile
                userProfileCache.set(uid, userData);
                setTimeout(() => userProfileCache.delete(uid), 3 * 60 * 1000); // 3m cache

                return userData;
            }

            // Fallback to Firestore if RTDB is empty
            const userRef = doc(db, 'users', uid);
            const docSnap = await getDoc(userRef);
            const finalData = docSnap.exists() ? docSnap.data() : null;
            
            if (finalData) {
                userProfileCache.set(uid, finalData);
                setTimeout(() => userProfileCache.delete(uid), 3 * 60 * 1000); // 3m cache
            }

            return finalData;
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
            const discoveryFields = [
                'firstName', 'birthday', 'gender', 'interestedIn',
                'lookingFor', 'city', 'bio', 'jobTitle', 'company',
                'height', 'pronouns'
            ];
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
            // 1. Remove the specific photo from RTDB
            const photoRef = rtdbRef(rtdb, `users/${uid}/photos/photo_${index}`);
            await set(photoRef, null);

            // 2. Fetch all remaining photos to perform auto-shifting
            const photosRef = rtdbRef(rtdb, `users/${uid}/photos`);
            const snap = await get(photosRef);

            let updatedPhotos = [];
            if (snap.exists()) {
                const currentPhotos = snap.val();
                // Filter out the nulls and compact the list
                for (let i = 0; i < 9; i++) {
                    if (currentPhotos[`photo_${i}`]) {
                        updatedPhotos.push(currentPhotos[`photo_${i}`]);
                    }
                }
            }

            // 3. Write back the compacted list to RTDB (ensures no gaps)
            const cleanPhotos = {};
            for (let i = 0; i < 9; i++) {
                cleanPhotos[`photo_${i}`] = updatedPhotos[i] || null;
            }
            await set(photosRef, cleanPhotos);

            // 4. Update both completion and the actual photos array in Firestore
            const fullProfile = await userService.getProfile(uid);
            const completion = userService.calculateCompletion(fullProfile);
            
            // SECURITY: Never save base64 to Firestore (1MB limit)
            const firestorePhotos = (fullProfile.photos || [])
                .filter(p => p != null)
                .map(p => isBase64(p) ? 'pending_upload' : p);

            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                photos: firestorePhotos,
                profileCompletion: completion,
                updatedAt: serverTimestamp(),
            });

            console.log(`✅ Photo ${index} removed and grid auto-shifted for ${uid}`);
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
        let score = 0;

        // 1. Identity (Max 20%)
        if (profile.firstName) score += 5;
        if (profile.birthday) score += 5;
        if (profile.gender) score += 5;
        if (profile.city) score += 5;

        // 2. Visuals (Max 40%) - 10% per photo for first 4 photos
        const photos = Array.isArray(profile.photos) ? profile.photos.filter(p => p != null) : [];
        score += Math.min(photos.length * 10, 40);

        // 3. About Me (Max 20%)
        if (profile.bio && profile.bio.length > 10) score += 10;
        if (profile.jobTitle) score += 5;
        if (profile.school || profile.education) score += 5;

        // 4. Discovery & Tags (Max 20%)
        if (profile.interestedIn) score += 5;
        if (profile.lookingFor) score += 5;
        if (Array.isArray(profile.interests) && profile.interests.length >= 3) {
            score += 10;
        } else if (Array.isArray(profile.interests) && profile.interests.length > 0) {
            score += 5;
        }

        return Math.min(score, 100);
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
    },

    /**
     * Check if a user has access to a specific feature based on their tier
     */
    canUseFeature: (profile, feature) => {
        if (!profile) return false;

        // 1. Check if the user is an admin (Admins bypass all gates)
        if (profile.role === 'admin') return true;

        const features = profile.premiumFeatures || [];
        const tier = (profile.premiumTier || '').toLowerCase();

        // 2. Direct Feature Array Check (Primary database-driven logic)
        if (features.includes(feature)) return true;

        // 3. Fallback Mapping (Ensures INSTANT update if features aren't synced yet)
        const tierEnforcements = {
            'silver': ['see_likes', 'unlimited_swipes', 'rewind', '5_super_likes_day'],
            'gold': ['see_likes', 'unlimited_swipes', 'rewind', '5_super_likes_day', 'top_picks', 'passport', '1_boost_month', 'ad_free_basic'],
            'platinum': ['see_likes', 'unlimited_swipes', 'rewind', '5_super_likes_day', 'top_picks', 'passport', '1_boost_month', 'ad_free_total', 'priority_likes', 'message_before_match', 'incognito', 'advanced_filters']
        };

        if (tier && tierEnforcements[tier]?.includes(feature)) return true;

        // 4. Fallback/Alias Check for common features
        const featureAliases = {
            'daily_boost': '1_boost_month',
            'no_ads': 'ad_free_total',
            'passport': 'passport_mode'
        };
        const alias = featureAliases[feature];
        if (alias && features.includes(alias)) return true;

        return false;
    },
    
    /**
     * Get the active chat capacity for a given tier
     */
    getChatLimit: (tier) => {
        const limits = {
            'free': 3,
            'silver': 8,
            'gold': 15,
            'platinum': Infinity
        };
        const key = (tier || 'free').toLowerCase();
        return limits[key] || 3;
    },

    /**
     * Track and limit daily swipes for free users
     */
    checkSwipeLimit: async (uid, profile) => {
        if (!profile) return false;

        // Premium users have no limits
        if (profile.hasPremium || profile.premiumTier) return true;

        const today = new Date().toISOString().split('T')[0];
        const lastSwipeDate = profile.lastSwipeDate || '';
        const dailyCount = lastSwipeDate === today ? (profile.dailySwipeCount || 0) : 0;

        // Free limit: 50 swipes per day
        return dailyCount < 50;
    },

    incrementSwipeCount: async (uid, profile) => {
        if (!profile || profile.hasPremium) return;

        const today = new Date().toISOString().split('T')[0];
        const lastSwipeDate = profile.lastSwipeDate || '';
        const dailyCount = lastSwipeDate === today ? (profile.dailySwipeCount || 0) : 0;

        await updateDoc(doc(db, 'users', uid), {
            dailySwipeCount: dailyCount + 1,
            lastSwipeDate: today
        });
    },

    /**
     * Calculate distance between two points in kilometers using Haversine formula
     */
    calculateDistance: (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;

        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    },

    /**
     * Update user's last session IP and location
     */
    updateLastSessionInfo: async (uid) => {
        try {
            let geoData = null;
            try {
                const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
                if (response.ok && response.headers.get('content-type')?.includes('json')) {
                    geoData = await response.json();
                }
            } catch (e) { }

            if (!geoData || geoData.error) {
                const response = await fetch('http://ip-api.com/json/', { signal: AbortSignal.timeout(5000) });
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        geoData = { ip: data.query, latitude: data.lat, longitude: data.lon, city: data.city, region: data.regionName };
                    }
                }
            }

            if (geoData && !geoData.error) {
                const { ip, latitude, longitude, city, region } = geoData;
                const location = { latitude, longitude, city, region, updatedAt: Date.now() };
                const userRef = doc(db, 'users', uid);
                await updateDoc(userRef, { lastIp: ip, location, lastSessionAt: serverTimestamp() });
                const profileLocRef = rtdbRef(rtdb, `users/${uid}/profile/location`);
                await set(profileLocRef, location);
            }
        } catch (error) { }
    },

    /**
     * Update user's high-precision device location
     */
    updateDeviceLocation: async (uid, coords) => {
        try {
            const { latitude, longitude } = coords;
            const location = { latitude, longitude, updatedAt: Date.now() };
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, { location, lastSessionAt: serverTimestamp() });
            const profileLocRef = rtdbRef(rtdb, `users/${uid}/profile/location`);
            await set(profileLocRef, location);
            console.log(`[UserService] 📍 Device location updated for ${uid}`);
        } catch (error) {
            console.error('[UserService] Error updating device location:', error);
        }
    }
};
