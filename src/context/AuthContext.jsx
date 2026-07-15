/**
 * AuthContext.jsx
 * 
 * Provides global authentication state management. 
 * Persists the current user session in sessionStorage and exposes 
 * utility functions for logging in and out from anywhere in the app.
 */

import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        const sessionData = sessionStorage.getItem("banking_user");
        return sessionData ? JSON.parse(sessionData) : null;
    });

    const triggerLogin = useCallback((loginResponse) => {
        // We now expect loginResponse to be { user, token }
        const { user, token } = loginResponse;

        const userProfileWithMetadata = {
            ...user,
            loginTime: new Date().toISOString(),
            token: token // Store the token
        };

        sessionStorage.setItem("banking_user", JSON.stringify(userProfileWithMetadata));
        setCurrentUser(userProfileWithMetadata);
    }, []);

    const triggerLogout = useCallback(() => {
        sessionStorage.removeItem("banking_user");
        setCurrentUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            user: currentUser,
            login: triggerLogin,
            logout: triggerLogout,
            isAuthenticated: !!currentUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const contextValue = useContext(AuthContext);

    if (!contextValue) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return contextValue;
}

