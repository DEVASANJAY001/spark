import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Service to handle user subscriptions and feature entitlements
 */
export const subscriptionService = {
    /**
     * Get user's current subscription details and plan features
     */
    getUserSubscription: async (uid, premiumTier) => {
        if (!premiumTier) return null;

        try {
            const planDoc = await getDoc(doc(db, 'plans', premiumTier));
            if (planDoc.exists()) {
                return {
                    id: planDoc.id,
                    ...planDoc.data()
                };
            }
            return null;
        } catch (error) {
            console.error('[SubscriptionService] Error fetching plan:', error);
            return null;
        }
    },

    /**
     * Helper to check if a user has a specific feature
     */
    hasFeature: (subscription, featureKey) => {
        if (!subscription) return false;
        return subscription.features?.includes(featureKey);
    }
};
