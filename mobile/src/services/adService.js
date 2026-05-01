import { collection, query, where, getDocs, addDoc, serverTimestamp, increment, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const adService = {
    /**
     * Fetch active ads for a specific placement, filtered by location/radius
     */
    getAdsByPlacement: async (placement, userCoords = null, userCity = null, userSubscription = null) => {
        try {
            // 0. Check if user has "100% Ad-Free" entitlement
            const features = userSubscription?.premiumFeatures || userSubscription?.features || [];
            const tier = userSubscription?.premiumTier;
            
            if (tier === 'platinum' || features.includes('ad_free_total')) {
                return [];
            }
            const adsRef = collection(db, 'app_ads');
            const q = query(
                adsRef, 
                where('placement', '==', placement),
                where('active', '==', true)
            );
            const snapshot = await getDocs(q);
            const now = new Date();

            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(ad => {
                    // 1. Check scheduling
                    const start = ad.startDate?.toDate ? ad.startDate.toDate() : new Date(0);
                    const end = ad.endDate?.toDate ? ad.endDate.toDate() : new Date(8640000000000000); 
                    const isTimeValid = now >= start && now <= end;
                    if (!isTimeValid) return false;

                    // 2. Check location targeting
                    if (ad.targetingType === 'city') {
                        return ad.targetingCity?.toLowerCase() === userCity?.toLowerCase();
                    }

                    if (ad.targetingType === 'radius' && userCoords) {
                        const { latitude, longitude } = userCoords;
                        const adLat = parseFloat(ad.targetingLat);
                        const adLng = parseFloat(ad.targetingLng);
                        const radiusKm = parseFloat(ad.targetingRadius) || 50;

                        if (isNaN(adLat) || isNaN(adLng)) return false;

                        // Haversine formula to calculate distance in KM
                        const R = 6371; // Earth's radius in KM
                        const dLat = (adLat - latitude) * Math.PI / 180;
                        const dLon = (adLng - longitude) * Math.PI / 180;
                        const a = 
                            Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(latitude * Math.PI / 180) * Math.cos(adLat * Math.PI / 180) * 
                            Math.sin(dLon/2) * Math.sin(dLon/2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                        const distance = R * c;

                        return distance <= radiusKm;
                    }

                    // 3. Filter by Media Type entitlements (Silver/Gold remove video ads)
                    if (features.includes('ad_free_video') && ad.mediaType === 'video') {
                        return false;
                    }
                    
                    return true; // Global or fallback
                })
                .sort((a, b) => (a.order || 0) - (b.order || 0));
        } catch (error) {
            console.error('[AdService] Error fetching ads:', error);
            return [];
        }
    },

    /**
     * Log an ad view/impression with location (Unique per user)
     */
    logImpression: async (adId, uid, location = 'Unknown') => {
        try {
            // Check if this user has already viewed this ad
            const analyticsRef = collection(db, 'ad_analytics');
            const q = query(
                analyticsRef,
                where('adId', '==', adId),
                where('uid', '==', uid),
                where('type', '==', 'impression')
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Only log and increment if it's the first time
                await addDoc(collection(db, 'ad_analytics'), {
                    adId,
                    uid,
                    type: 'impression',
                    location,
                    timestamp: serverTimestamp()
                });
                
                const adRef = doc(db, 'app_ads', adId);
                await updateDoc(adRef, {
                    totalImpressions: increment(1)
                });
            }
        } catch (error) {
            console.error('[AdService] Error logging impression:', error);
        }
    },

    /**
     * Log ad engagement (click or long view) with location (Unique per user)
     */
    logEngagement: async (adId, uid, durationMs = 0, location = 'Unknown') => {
        try {
            // Check if this user has already engaged with this ad
            const analyticsRef = collection(db, 'ad_analytics');
            const q = query(
                analyticsRef,
                where('adId', '==', adId),
                where('uid', '==', uid),
                where('type', '==', 'engagement')
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Only log and increment if it's the first time
                await addDoc(collection(db, 'ad_analytics'), {
                    adId,
                    uid,
                    type: 'engagement',
                    duration: durationMs,
                    location,
                    timestamp: serverTimestamp()
                });

                const adRef = doc(db, 'app_ads', adId);
                await updateDoc(adRef, {
                    totalEngagement: increment(1),
                    totalEngagementTime: increment(durationMs)
                });
            }
        } catch (error) {
            console.error('[AdService] Error logging engagement:', error);
        }
    }
};
