import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBlkSW4F6mvLCGhGOP-ujCVZ1RUwF4FGEg",
    authDomain: "gets-a8675.firebaseapp.com",
    projectId: "gets-a8675",
    storageBucket: "gets-a8675.firebasestorage.app",
    messagingSenderId: "477160304299",
    appId: "1:477160304299:web:5e7d802d870100f2fc91ee",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const plans = [
    { 
        id: 'plus', 
        name: 'Spark Plus', 
        price: 199, 
        period: 'month', 
        features: [
            'Unlimited Likes', 
            'Unlimited Rewinds', 
            'Passport™ Mode (Change location)', 
            'No Ads', 
            'Incognito Mode'
        ], 
        colors: ['#FF006E', '#FF4D94'] 
    },
    { 
        id: 'gold', 
        name: 'Spark Gold', 
        price: 319, 
        period: 'month', 
        features: [
            'Everything in Plus', 
            'See Who Likes You', 
            'New Top Picks Daily', 
            'Weekly Super Likes', 
            '1 Free Boost a month'
        ], 
        colors: ['#D4AF37', '#FFD700'], 
        popular: true 
    },
    { 
        id: 'platinum', 
        name: 'Spark Platinum', 
        price: 769, 
        period: 'month', 
        features: [
            'Everything in Gold', 
            'Message before matching', 
            'Priority Likes', 
            'See Likes you’ve sent (History)'
        ], 
        colors: ['#424242', '#212121'] 
    }
];

const seed = async () => {
    console.log('Seeding plans...');
    for (const plan of plans) {
        await setDoc(doc(db, 'plans', plan.id), plan);
    }
    
    console.log('Seeding initial test user...');
    await setDoc(doc(db, 'users', 'test_admin_user'), {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@spark.com',
        status: 'Active',
        hasPremium: true,
        premiumTier: 'platinum',
        createdAt: serverTimestamp(),
        isVerified: true
    });

    console.log('Done!');
};

seed().catch(console.error);
