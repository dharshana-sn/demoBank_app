import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync, setupNotificationHandler } from '../utils/notifications';
import { updateUserProfile, getUserProfile, setOnUnauthorized } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const login = async (userData) => {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Push notification registration
        try {
            const token = await registerForPushNotificationsAsync();
            if (token && userData.id) {
                await updateUserProfile(userData.id, { pushToken: token });
                const updatedUser = { ...userData, pushToken: token };
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (err) {
            console.error('Failed to update push token:', err);
        }
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('user');
    };

    const restoreUser = async () => {
        try {
            const stored = await AsyncStorage.getItem('user');
            if (stored) {
                const userData = JSON.parse(stored);
                
                // If there's no JWT token, log out immediately to force re-authentication
                if (!userData.token) {
                    await AsyncStorage.removeItem('user');
                    setUser(null);
                    return;
                }

                // Verify the token by calling getUserProfile
                try {
                    await getUserProfile(userData.id);
                    setUser(userData);

                    // Ensure push notifications are enabled on restoration
                    if (!userData.pushToken) {
                        const token = await registerForPushNotificationsAsync();
                        if (token && userData.id) {
                            const updatedUser = { ...userData, pushToken: token };
                            setUser(updatedUser);
                            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                            await updateUserProfile(userData.id, { pushToken: token });
                        }
                    }
                } catch (err) {
                    // Check if token verification failed due to authentication issue
                    if (err.message.includes('Access denied') || err.message.includes('token') || err.message.includes('API error')) {
                        await AsyncStorage.removeItem('user');
                        setUser(null);
                    } else {
                        // Network error or server offline. Keep current session cached.
                        setUser(userData);
                    }
                }
            }
        } catch (_) {}
    };

    useEffect(() => {
        setupNotificationHandler();
        setOnUnauthorized(async () => {
            setUser(null);
            await AsyncStorage.removeItem('user');
        });
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, restoreUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
