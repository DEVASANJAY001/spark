import { db } from '../firebase/config';
import { collection, doc, setDoc } from 'firebase/firestore';

const plans = [
    {
        id: 'plus',
        name: 'Spark Plus',
        price: 199,
        period: 'month',
        features: ['Unlimited Likes', 'Unlimited Rewinds', 'Passport™ Mode', 'No Ads'],
        colors: ['#FF006E', '#FF4D94'],
    },
    {
        id: 'gold',
        name: 'Spark Gold',
        price: 319,
        period: 'month',
        features: ['See Who Likes You', 'New Top Picks Daily', '5 Super Likes a week', '1 Free Boost a month'],
        colors: ['#D4AF37', '#FFD700'],
        popular: true
    },
    {
        id: 'platinum',
        name: 'Spark Platinum',
        price: 769,
        period: 'month',
        features: ['Message before matching', 'Priority Likes', 'See Likes you’ve sent', 'All Gold features'],
        colors: ['#424242', '#212121'],
    }
];

export const seedPlans = async () => {
    try {
        for (const plan of plans) {
            await setDoc(doc(db, 'plans', plan.id), plan);
        }
        console.log('Plans seeded successfully');
    } catch (error) {
        console.error('Error seeding plans:', error);
    }
};
