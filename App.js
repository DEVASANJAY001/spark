import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useState, useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/components/SplashScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
    const [isSplashVisible, setIsSplashVisible] = useState(true);

    useEffect(() => {
        // Branding splash only — location is handled by LocationGate in RootNavigator
        const timer = setTimeout(() => {
            setIsSplashVisible(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    if (isSplashVisible) {
        return <SplashScreen onFinish={() => setIsSplashVisible(false)} />;
    }

    return (
        <SafeAreaProvider>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={true}
            />
            <ThemeProvider>
                <RootNavigator />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}