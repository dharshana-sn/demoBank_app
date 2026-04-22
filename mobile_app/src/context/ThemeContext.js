import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, DARK_COLORS } from '../theme/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [darkMode, setDarkModeState] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('darkMode').then(val => {
            if (val === 'true') setDarkModeState(true);
        }).catch(() => {});
    }, []);

    const setDarkMode = (val) => {
        setDarkModeState(val);
        AsyncStorage.setItem('darkMode', val ? 'true' : 'false').catch(() => {});
    };

    const C = darkMode ? DARK_COLORS : COLORS;

    return (
        <ThemeContext.Provider value={{ darkMode, setDarkMode, C }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
