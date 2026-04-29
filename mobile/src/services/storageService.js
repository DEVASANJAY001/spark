// src/services/storageService.js — Mobile optimized (no web FileReader/fetch blob)
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as rtdbRef, set } from 'firebase/database';
import { storage, rtdb } from '../firebase/config';
import * as FileSystem from 'expo-file-system/legacy';

export const storageService = {
    /**
     * Upload avatar image — RTDB Primary (Base64) + Firebase Storage
     * Mobile-only: uses expo-file-system for base64 encoding (no FileReader)
     */
    uploadAvatar: async (uid, uri, index) => {
        try {
            // 1. Convert to Base64 using expo-file-system (mobile native)
            const rawBase64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });
            const base64 = `data:image/jpeg;base64,${rawBase64}`;

            // 2. Store in RTDB for backward compatibility / fast load
            const dbPath = `users/${uid}/photos/photo_${index}`;
            await set(rtdbRef(rtdb, dbPath), base64);

            // 3. Primary: Firebase Storage (standard practice)
            try {
                const response = await fetch(uri);
                const blob = await response.blob();
                const photoRef = storageRef(storage, `avatars/${uid}/photo_${index}.jpg`);
                await uploadBytes(photoRef, blob);
                const downloadURL = await getDownloadURL(photoRef);
                console.log(`✅ Photo ${index} stored in Storage and RTDB`);
                return { url: downloadURL, dataUri: base64 };
            } catch (storageError) {
                console.warn('⚠️ Storage upload failed, falling back to RTDB base64', storageError.message);
                return { url: base64, dataUri: base64 };
            }

        } catch (error) {
            console.error('❌ Error storing image:', error);
            throw error;
        }
    }
};
