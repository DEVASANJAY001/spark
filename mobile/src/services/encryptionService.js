import CryptoJS from 'crypto-js';

/**
 * Generate a hex key using our polyfilled crypto.getRandomValues
 * This avoids CryptoJS.lib.WordArray.random() which uses native crypto
 * and crashes on React Native with "Native crypto module could not be used"
 */
const generateSafeRandomKey = (byteLength = 32) => {
    const bytes = new Uint8Array(byteLength);
    // Uses our polyfill from index.js (global.crypto.getRandomValues)
    if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
        global.crypto.getRandomValues(bytes);
    } else {
        // Ultimate fallback
        for (let i = 0; i < byteLength; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    // Convert to hex string
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const encryptionService = {
    /**
     * Encrypt a string using a symmetric key
     */
    encrypt: (text, key) => {
        if (!text || !key) return text;
        try {
            return CryptoJS.AES.encrypt(text, key).toString();
        } catch (error) {
            console.warn('Encryption failed, sending plaintext:', error.message);
            return text;
        }
    },

    /**
     * Decrypt a ciphertext using a symmetric key
     */
    decrypt: (ciphertext, key) => {
        if (!ciphertext || !key) return ciphertext;
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, key);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (!originalText) return ciphertext; // Return raw if decryption yields empty
            return originalText;
        } catch (error) {
            console.warn('Decryption failed:', error.message);
            return ciphertext; // Return raw ciphertext instead of "[Encrypted Message]"
        }
    },

    /**
     * Generate a random key for a new chat
     * Uses our polyfilled getRandomValues instead of CryptoJS.lib.WordArray.random
     */
    generateKey: () => {
        return generateSafeRandomKey(32);
    }
};
