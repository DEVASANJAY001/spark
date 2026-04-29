import { rtdb } from '../firebase/config';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';

export const presenceService = {
    /**
     * Set user status to online/offline
     */
    setUserStatus: (uid) => {
        const userStatusDatabaseRef = ref(rtdb, `/status/${uid}`);

        const isOfflineForDatabase = {
            state: 'offline',
            last_changed: serverTimestamp(),
        };

        const isOnlineForDatabase = {
            state: 'online',
            last_changed: serverTimestamp(),
        };

        const connectedRef = ref(rtdb, '.info/connected');

        return onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === false) {
                return;
            }

            onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                set(userStatusDatabaseRef, isOnlineForDatabase);
            });
        });
    },

    /**
     * Listen to a user's status
     */
    subscribeToUserStatus: (uid, callback) => {
        const statusRef = ref(rtdb, `/status/${uid}`);
        return onValue(statusRef, (snapshot) => {
            const data = snapshot.val();
            callback(data);
        });
    }
};
