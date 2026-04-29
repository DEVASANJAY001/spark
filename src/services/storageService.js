// src/services/storageService.js
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as rtdbRef, set } from 'firebase/database';
import { storage, rtdb } from '../firebase/config';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export const storageService = {
    /**
     * Upload avatar image - RTDB Primary (Base64)
     */
    uploadAvatar: async (uid, uri, index) => {
        try {
            // 1. Convert to Base64 (Keep RTDB Fallback for instant previews)
            let base64;
            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                const reader = new FileReader();
                base64 = await new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } else {
                const rawBase64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: 'base64',
                });
                base64 = `data:image/jpeg;base64,${rawBase64}`;
            }

            // Store in RTDB for backward compatibility / fast load
            const dbPath = `users/${uid}/photos/photo_${index}`;
            await set(rtdbRef(rtdb, dbPath), base64);

            // 2. Primary: Firebase Storage (Standard Practice)
            try {
                const response = await fetch(uri);
                const blob = await response.blob();
                const photoRef = storageRef(storage, `avatars/${uid}/photo_${index}.jpg`);
                await uploadBytes(photoRef, blob);
                const downloadURL = await getDownloadURL(photoRef);
                console.log(`✅ Photo ${index} stored in Storage and RTDB`);
                return { url: downloadURL, dataUri: base64 };
            } catch (storageError) {
                console.warn('⚠️ Storage upload failed (likely CORS on Web). Falling back to RTDB URI:', storageError.message);
                // Return the base64 as the URL so the app still works until CORS is fixed
                return { url: base64, dataUri: base64 };
            }

        } catch (error) {
            console.error('❌ Error storing image:', error);
            throw error;
        }
    }
};
