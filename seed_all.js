import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBlkSW4F6mvLCGhGOP-ujCVZ1RUwF4FGEg",
    authDomain: "gets-a8675.firebaseapp.com",
    projectId: "gets-a8675",
    storageBucket: "gets-a8675.firebasestorage.app",
    messagingSenderId: "477160304299",
    appId: "1:477160304299:web:5e7d802d870100f2fc91ee",
    measurementId: "G-2865MVXY6W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedData = async () => {
    console.log("🚀 Starting System Seeding...");

    // 1. SEED PLANS
    const plans = [
        {
            id: 'silver',
            name: 'Spark Silver',
            price: 499,
            duration: '1 Month',
            features: [
                'See who likes you',
                'Unlimited likes',
                '5 Super likes per week',
                'No ads'
            ],
            tier: 'silver'
        },
        {
            id: 'gold',
            name: 'Spark Gold',
            price: 999,
            duration: '1 Month',
            features: [
                'Everything in Silver',
                'Top Picks daily',
                'See who visited your profile',
                'Priority likes'
            ],
            tier: 'gold'
        },
        {
            id: 'platinum',
            name: 'Spark Platinum',
            price: 1999,
            duration: '1 Month',
            features: [
                'Everything in Gold',
                'Message before matching',
                'See likes you sent',
                'Global passport'
            ],
            tier: 'platinum'
        }
    ];

    for (const plan of plans) {
        await setDoc(doc(db, 'plans', plan.id), plan);
        console.log(`✅ Plan ${plan.name} seeded.`);
    }

    // 2. SEED SAMPLE AD COMPANIES
    const companies = [
        { id: 'spark_internal', name: 'Spark Media', industry: 'Social', contact: 'admin@spark.com', status: 'Active' },
        { id: 'partner_1', name: 'Lifestyle Co.', industry: 'Fashion', contact: 'sales@lifestyle.com', status: 'Active' }
    ];

    for (const comp of companies) {
        await setDoc(doc(db, 'ad_companies', comp.id), comp);
        console.log(`✅ Company ${comp.name} seeded.`);
    }

    // 3. SEED SAMPLE ADS
    const ads = [
        {
            id: 'premium_upsell',
            companyId: 'spark_internal',
            title: 'Go Platinum!',
            description: 'Unlock 10x more matches with Spark Platinum.',
            imageUrl: 'https://images.unsplash.com/photo-1512351735139-ce015767c7f9?q=80&w=1000',
            targetUrl: 'spark://subscriptions',
            type: 'banner',
            status: 'Active',
            totalImpressions: 0,
            totalEngagement: 0
        }
    ];

    for (const ad of ads) {
        await setDoc(doc(db, 'app_ads', ad.id), ad);
        console.log(`✅ Ad ${ad.title} seeded.`);
    }

    // 4. SEED SAMPLE COUPONS
    const coupons = [
        { id: 'SPARK50', code: 'SPARK50', discountType: 'percentage', discountValue: 50, expiryDate: new Date('2026-12-31'), isActive: true },
        { id: 'WELCOME100', code: 'WELCOME100', discountType: 'fixed', discountValue: 100, expiryDate: new Date('2026-12-31'), isActive: true }
    ];

    for (const coupon of coupons) {
        await setDoc(doc(db, 'coupons', coupon.id), coupon);
        console.log(`✅ Coupon ${coupon.code} seeded.`);
    }

    console.log("✨ Seeding Complete!");
};

seedData().catch(console.error);
