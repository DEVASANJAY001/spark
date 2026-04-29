import * as ExpoCrypto from 'expo-crypto';

// Polyfill for crypto.getRandomValues (required by Firebase/Firestore on React Native)
// On web, window.crypto is read-only and already exists — skip polyfill
const cryptoPolyfill = {
    getRandomValues: (byteArray) => {
        try {
            const randomBytes = ExpoCrypto.getRandomBytes(byteArray.length);
            for (let i = 0; i < byteArray.length; i++) {
                byteArray[i] = randomBytes[i];
            }
        } catch (e) {
            // Fallback to Math.random for ID generation
            for (let i = 0; i < byteArray.length; i++) {
                byteArray[i] = Math.floor(Math.random() * 256);
            }
        }
        return byteArray;
    },
};

// Only polyfill if crypto is NOT already available (i.e. React Native, not web)
if (typeof global.crypto === 'undefined' || !global.crypto || !global.crypto.getRandomValues) {
    // Use Object.defineProperty to handle cases where crypto might be partially defined
    try {
        global.crypto = cryptoPolyfill;
    } catch (e) {
        // If global.crypto is read-only (web), skip — it's already available
    }
}

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
