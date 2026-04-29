import { db } from '../firebase/config';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    doc, 
    increment,
    serverTimestamp,
    addDoc 
} from 'firebase/firestore';

export const couponService = {
    /**
     * Validate and redeem a coupon code
     */
    redeemCoupon: async (uid, code) => {
        try {
            const cleanCode = code.trim().toUpperCase();
            console.log(`[CouponService] Attempting to redeem: "${cleanCode}" for user: ${uid}`);

            // 1. Find the coupon
            const q = query(collection(db, 'coupons'), where('code', '==', cleanCode));
            let querySnapshot = await getDocs(q);

            // Fallback: If query yields 0 but we want to be absolutely sure, fetch all active
            if (querySnapshot.empty) {
                console.log('[CouponService] Query returned 0, attempting collection scan fallback...');
                const allSnap = await getDocs(collection(db, 'coupons'));
                
                // DEEP DEBUG: Log all codes in DB
                console.log('[CouponService] Exhaustive List of Codes in Database:');
                allSnap.docs.forEach(d => {
                    const dCode = d.data().code;
                    console.log(` - "${dCode}" (Length: ${dCode?.length}, Type: ${typeof dCode})`);
                });

                const match = allSnap.docs.find(d => {
                    const dCode = d.data().code;
                    return dCode && dCode.toString().trim().toUpperCase() === cleanCode;
                });

                if (match) {
                    console.log(`[CouponService] Found via fallback! Document ID: ${match.id}`);
                    // Create a pseudo-snapshot to continue the logic
                    querySnapshot = { empty: false, docs: [match], size: 1 };
                }
            }

            console.log(`[CouponService] Final matches for code "${cleanCode}": ${querySnapshot.size}`);

            if (querySnapshot.empty) {
                throw new Error('Invalid coupon code. Please check for typos.');
            }

            const couponDoc = querySnapshot.docs[0];
            const couponData = couponDoc.data();

            // 2. Validate Coupon
            if (couponData.status !== 'Active') {
                throw new Error('This coupon is no longer active');
            }

            if (couponData.usage >= couponData.limit) {
                throw new Error('This coupon has reached its usage limit');
            }

            if (couponData.expiry) {
                const expiryDate = new Date(couponData.expiry);
                if (expiryDate < new Date()) {
                    throw new Error('This coupon has expired');
                }
            }

            // 3. Process Redemption
            // In this app, we'll assume coupons grant "Spark Plus" for 30 days
            // You can customize this based on couponData.type/discount
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);

            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                hasPremium: true,
                premiumTier: 'plus',
                premiumExpiry: expiry.toISOString(),
                updatedAt: serverTimestamp()
            });

            // 4. Update Coupon Usage
            await updateDoc(doc(db, 'coupons', couponDoc.id), {
                usage: increment(1)
            });

            // 5. Log Transaction
            await addDoc(collection(db, 'transactions'), {
                uid,
                type: 'coupon_redemption',
                amount: 0,
                couponCode: code,
                status: 'completed',
                createdAt: serverTimestamp()
            });

            return { success: true, message: 'Coupon redeemed successfully! You now have Spark Plus.' };

        } catch (error) {
            console.error('Redeem Error:', error);
            throw error;
        }
    },

    /**
     * Validate a coupon without redeeming it
     */
    validateCoupon: async (code) => {
        try {
            const cleanCode = code.trim().toUpperCase();
            
            // Re-use the existing logic including the fallback scan
            const q = query(collection(db, 'coupons'), where('code', '==', cleanCode));
            let querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                const allSnap = await getDocs(collection(db, 'coupons'));
                const match = allSnap.docs.find(d => {
                    const dCode = d.data().code;
                    return dCode && dCode.toString().trim().toUpperCase() === cleanCode;
                });
                if (match) {
                    querySnapshot = { empty: false, docs: [match], size: 1 };
                }
            }

            if (querySnapshot.empty) {
                throw new Error('Invalid coupon code');
            }

            const couponData = querySnapshot.docs[0].data();
            
            // Check status and limits
            if (couponData.status !== 'Active') throw new Error('This coupon is no longer active');
            if (couponData.usage >= couponData.limit) throw new Error('This coupon has reached its usage limit');
            if (couponData.expiry && new Date(couponData.expiry) < new Date()) {
                throw new Error('This coupon has expired');
            }

            return {
                id: querySnapshot.docs[0].id,
                ...couponData
            };
        } catch (error) {
            console.error('Validate Error:', error);
            throw error;
        }
    }
};
