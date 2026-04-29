import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { auth, db, rtdb } from '../firebase/config';
import { userService } from '../services/userService';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            if (authUser) {
                setUser(authUser);

                // 1. Listen to Firestore (System Flags & Discovery Index)
                const unsubscribeFirestore = onSnapshot(doc(db, 'users', authUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setIsProfileComplete(data.isProfileComplete || false);
                        
                        // Redundant sync for premium status to ensure app-wide consistency
                        if (data.premiumTier) {
                            setProfile(prev => ({ 
                                ...prev, 
                                premiumTier: data.premiumTier, 
                                hasPremium: data.hasPremium 
                            }));
                        }
                    }
                });

                // 2. Listen to RTDB Profile (Primary Source for Active User)
                const profileRef = ref(rtdb, `users/${authUser.uid}/profile`);
                const unsubscribeProfile = onValue(profileRef, (snap) => {
                    if (snap.exists()) {
                        const rtdbProfile = snap.val();

                        // Merge with photos if they exist (cached locally or listened via sibling)
                        // Actually, let's just listen to the whole user node for simplicity
                        // or stick to specific nodes if performance is a concern.
                        setProfile(prev => {
                            // Only trigger session update once per profile load
                            if (!prev && rtdbProfile) {
                                userService.updateLastSessionInfo(authUser.uid);
                            }
                            return { ...prev, ...rtdbProfile };
                        });
                    }
                    setLoading(false);
                });

                // 3. Listen to RTDB Photos
                const photosRef = ref(rtdb, `users/${authUser.uid}/photos`);
                const unsubscribePhotos = onValue(photosRef, (snap) => {
                    if (snap.exists()) {
                        const rtdbPhotos = snap.val();
                        const mergedPhotos = [];
                        for (let i = 0; i < 9; i++) {
                            if (rtdbPhotos[`photo_${i}`]) mergedPhotos.push(rtdbPhotos[`photo_${i}`]);
                        }
                        setProfile(prev => ({ ...prev, photos: mergedPhotos }));
                    }
                });

                return () => {
                    unsubscribeFirestore();
                    unsubscribeProfile();
                    unsubscribePhotos();
                };
            } else {
                setUser(null);
                setProfile(null);
                setIsProfileComplete(false);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (user?.uid) {
            const { notificationService } = require('../services/notificationService');
            notificationService.registerForPushNotificationsAsync(user.uid).catch(err => 
                console.log('Push notification error:', err)
            );
        }
    }, [user?.uid]);

    const updateProfile = async (data) => {
        if (!user) return;
        try {
            await userService.saveProfile(user.uid, data);
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Force account selection for Google Sign-In next time
            try {
                const Constants = require('expo-constants').default;
                if (Constants.appOwnership !== 'expo') {
                    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
                    await GoogleSignin.signOut();
                }
            } catch (googleError) {
                // Ignore if not native or not configured
            }
            await auth.signOut();
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    };

    const deleteAccount = async () => {
        if (!user) return;
        try {
            await userService.deleteAccount(auth, user);
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    };

    return { user, profile, isProfileComplete, loading, updateProfile, logout, deleteAccount };
};

export default useAuth;