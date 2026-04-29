import * as ExpoCrypto from 'expo-crypto';

// Polyfill for crypto.getRandomValues — required by Firebase/Firestore on React Native
if (typeof global.crypto === 'undefined' || !global.crypto?.getRandomValues) {
    try {
        global.crypto = {
            getRandomValues: (byteArray) => {
                try {
                    const randomBytes = ExpoCrypto.getRandomBytes(byteArray.length);
                    for (let i = 0; i < byteArray.length; i++) {
                        byteArray[i] = randomBytes[i];
                    }
                } catch {
                    for (let i = 0; i < byteArray.length; i++) {
                        byteArray[i] = Math.floor(Math.random() * 256);
                    }
                }
                return byteArray;
            },
        };
    } catch (e) {
        // Silently skip if already defined
    }
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
