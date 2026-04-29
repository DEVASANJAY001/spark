import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBlkSW4F6mvLCGhGOP-ujCVZ1RUwF4FGEg",
    authDomain: "gets-a8675.firebaseapp.com",
    projectId: "gets-a8675",
    storageBucket: "gets-a8675.firebasestorage.app",
    messagingSenderId: "477160304299",
    appId: "1:477160304299:web:5e7d802d870100f2fc91ee",
    measurementId: "G-2865MVXY6W",
    databaseURL: "https://gets-a8675-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
