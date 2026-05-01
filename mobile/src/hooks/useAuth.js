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
        const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                setUser(authUser);

                // Start fetching in parallel for speed
                const fetchInitialData = async () => {
                    try {
                        const { getDoc, doc } = require('firebase/firestore');
                        const { get, ref } = require('firebase/database');
                        
                        const [fsSnap, rtdbSnap] = await Promise.all([
                            getDoc(doc(db, 'users', authUser.uid)),
                            get(ref(rtdb, `users/${authUser.uid}/profile`))
                        ]);

                        if (fsSnap.exists() || rtdbSnap.exists()) {
                            const fsData = fsSnap.exists() ? fsSnap.data() : {};
                            const rtdbData = rtdbSnap.exists() ? rtdbSnap.val() : {};
                            
                            setIsProfileComplete(fsData.isProfileComplete || false);
                            setProfile({
                                ...rtdbData,
                                ...fsData
                            });
                        }
                    } catch (e) {
                        console.log('Initial fetch error:', e);
                    } finally {
                        setLoading(false); // Unblock UI as fast as possible
                    }
                };

                fetchInitialData();

                // 1. Listen to Firestore
                const unsubscribeFirestore = onSnapshot(doc(db, 'users', authUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setIsProfileComplete(data.isProfileComplete || false);
                        setProfile(prev => ({ ...prev, ...data }));
                    }
                });

                // 2. Listen to RTDB Profile
                const profileRef = ref(rtdb, `users/${authUser.uid}/profile`);
                const unsubscribeProfile = onValue(profileRef, (snap) => {
                    if (snap.exists()) {
                        setProfile(prev => ({ ...prev, ...snap.val() }));
                    }
                });

                // 3. Listen to RTDB Photos
                const photosRef = ref(rtdb, `users/${authUser.uid}/photos`);
                const unsubscribePhotos = onValue(photosRef, (snap) => {
                    const mergedPhotos = new Array(9).fill(null);
                    if (snap.exists()) {
                        const rtdbPhotos = snap.val();
                        for (let i = 0; i < 9; i++) {
                            if (rtdbPhotos[`photo_${i}`]) {
                                mergedPhotos[i] = rtdbPhotos[`photo_${i}`];
                            }
                        }
                    }
                    setProfile(prev => ({ ...prev, photos: mergedPhotos }));
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
            try {
                const Constants = require('expo-constants').default;
                if (Constants.appOwnership !== 'expo') {
                    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
                    await GoogleSignin.signOut();
                }
            } catch (googleError) {
                // Ignore
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