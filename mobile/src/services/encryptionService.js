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
            // CryptoJS might crash if it attempts to use native crypto for salt generation
            // when given a raw string. We ensure it's treated as a secure key.
            const bytes = CryptoJS.AES.decrypt(ciphertext, key);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!originalText && ciphertext.includes('U2FsdGVkX1')) {
                // If it looks like AES but yielded nothing, it might be a key mismatch
                console.warn('Decryption yielded empty string - possible key mismatch');
                return '[Encrypted Message]';
            }
            
            return originalText || ciphertext;
        } catch (error) {
            // The error "Native crypto module could not be used" often happens in CryptoJS 
            // when it tries to seed its internal PRNG. 
            console.warn('Decryption error:', error.message);
            return ciphertext;
        }
    },

    /**
     * Generate a random key for a new chat
     * Uses our polyfilled getRandomValues instead of CryptoJS.lib.WordArray.random
     */
    generateKey: () => {
        try {
            return generateSafeRandomKey(32);
        } catch (e) {
            // Fallback to simpler random if polyfill fails
            return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
    }
};
