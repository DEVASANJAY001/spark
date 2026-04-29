import { initializeApp } from 'firebase/app';
import {
    initializeAuth,
    getReactNativePersistence,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyBlkSW4F6mvLCGhGOP-ujCVZ1RUwF4FGEg",
    authDomain: "gets-a8675.firebaseapp.com",
    projectId: "gets-a8675",
    storageBucket: "gets-a8675.firebasestorage.app",
    messagingSenderId: "477160304299",
    appId: "1:477160304299:web:5e7d802d870100f2fc91ee",
    measurementId: "G-2865MVXY6W",
    databaseURL: "https://gets-a8675-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);

// Mobile: always use native AsyncStorage persistence
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
