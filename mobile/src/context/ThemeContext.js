import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@spark_theme_mode';

export const lightColors = {
    primary: '#0EA5E9',
    primaryLight: '#BAE6FD',
    primaryDark: '#0284C7',
    secondary: '#F59E0B',
    accent: '#7DD3FC',
    background: '#FFFFFF',
    surface: '#F0F7FF',
    card: '#FFFFFF',
    cardAlt: '#F8FAFC',
    border: '#E0E7EE',
    text: '#1A1A2E',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    white: '#FFFFFF',
    black: '#000000',
    grey: '#64748B',
    lightGrey: '#94A3B8',
    dark: '#1A1A2E',
    blue: '#0EA5E9',
    gold: '#D4AF37',
    gradient: ['#0EA5E9', '#38BDF8'],
    premiumGradient: ['#D4AF37', '#FFD700'],
    darkGradient: ['#0284C7', '#0EA5E9'],
    inputBg: '#F0F7FF',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E0E7EE',
    headerBg: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.5)',
    success: '#10B981',
    danger: '#EF4444',
    shadowColor: '#000',
    bubbleMine: ['#0EA5E9', '#38BDF8'],
    bubbleTheirs: '#F0F7FF',
    bubbleTheirsText: '#1A1A2E',
    chipBg: '#F0F7FF',
    chipBorder: '#BAE6FD',
    chipText: '#0284C7',
    badgeBg: '#0EA5E9',
    badgeText: '#FFFFFF',
    searchBg: '#F0F7FF',
    modalBg: 'rgba(0,0,0,0.5)',
    modalContent: '#FFFFFF',
    switchTrack: '#CBD5E1',
};

export const darkColors = {
    primary: '#38BDF8',
    primaryLight: '#0C4A6E',
    primaryDark: '#0EA5E9',
    secondary: '#F59E0B',
    accent: '#7DD3FC',
    background: '#000000',
    surface: '#111111',
    card: '#1A1A1A',
    cardAlt: '#0F0F0F',
    border: '#222222',
    text: '#F0F0F0',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    white: '#FFFFFF',
    black: '#000000',
    grey: '#94A3B8',
    lightGrey: '#64748B',
    dark: '#F0F0F0',
    blue: '#38BDF8',
    gold: '#FFD700',
    gradient: ['#0369A1', '#0EA5E9'],
    premiumGradient: ['#D4AF37', '#FFD700'],
    darkGradient: ['#000000', '#111111'],
    inputBg: '#111111',
    tabBar: '#0A0A0A',
    tabBarBorder: '#1A1A1A',
    headerBg: '#000000',
    overlay: 'rgba(0,0,0,0.8)',
    success: '#34D399',
    danger: '#F87171',
    shadowColor: '#000',
    bubbleMine: ['#0369A1', '#0EA5E9'],
    bubbleTheirs: '#1A1A1A',
    bubbleTheirsText: '#F0F0F0',
    chipBg: '#1A1A1A',
    chipBorder: '#333333',
    chipText: '#38BDF8',
    badgeBg: '#38BDF8',
    badgeText: '#000000',
    searchBg: '#111111',
    modalBg: 'rgba(0,0,0,0.85)',
    modalContent: '#1A1A1A',
    switchTrack: '#333333',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(true); // Default to dark

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const val = await AsyncStorage.getItem(THEME_KEY);
            if (val !== null) {
                setIsDark(val === 'dark');
            }
        } catch (e) {
            console.log('Theme load error:', e);
        }
    };

    const toggleTheme = async () => {
        const newMode = !isDark;
        setIsDark(newMode);
        try {
            await AsyncStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light');
        } catch (e) {
            console.log('Theme save error:', e);
        }
    };

    const setTheme = async (mode) => {
        const dark = mode === 'dark';
        setIsDark(dark);
        try {
            await AsyncStorage.setItem(THEME_KEY, mode);
        } catch (e) {
            console.log('Theme save error:', e);
        }
    };

    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
