import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import OverviewScreen from './src/screens/OverviewScreen';
import AccountsScreen from './src/screens/AccountsScreen';
import CreditCardsScreen from './src/screens/CreditCardsScreen';
import TransfersScreen from './src/screens/TransfersScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import FixedDepositsScreen from './src/screens/FixedDepositsScreen';
import KycScreen from './src/screens/KycScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';

import { COLORS, FONTS } from './src/theme/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
    'Overview':   { active: '🏠', inactive: '🏠' },
    'Accounts':   { active: '💰', inactive: '💰' },
    'Transfers':  { active: '💸', inactive: '💸' },
    'Analytics':  { active: '📊', inactive: '📊' },
    'Credit Cards': { active: '💳', inactive: '💳' },
    'Fixed Deposits': { active: '🏦', inactive: '🏦' },
    'KYC':        { active: '🛡️', inactive: '🛡️' },
    'Settings':   { active: '⚙️', inactive: '⚙️' },
};

function DashboardTabs() {
    const { C } = useTheme();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: C.primary,
                tabBarInactiveTintColor: C.textLight,
                tabBarStyle: {
                    backgroundColor: C.card,
                    borderTopColor: C.border,
                    borderTopWidth: 1,
                    height: 68,
                    paddingBottom: 8,
                    paddingTop: 8,
                    elevation: 14,
                    shadowColor: '#054279',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.10,
                    shadowRadius: 12,
                },
                tabBarLabelStyle: {
                    ...FONTS.medium,
                    fontSize: 11,
                },
                tabBarIcon: ({ focused }) => {
                    const icons = TAB_ICONS[route.name];
                    return (
                        <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.45 }}>
                            {focused ? icons?.active : icons?.inactive}
                        </Text>
                    );
                },
            })}
        >
            <Tab.Screen name="Overview" component={OverviewScreen} />
            <Tab.Screen name="Accounts" component={AccountsScreen} />
            <Tab.Screen name="Transfers" component={TransfersScreen} />
            <Tab.Screen name="Analytics" component={AnalyticsScreen} />
            <Tab.Screen name="Credit Cards" component={CreditCardsScreen} />
            <Tab.Screen name="Fixed Deposits" component={FixedDepositsScreen} />
            <Tab.Screen name="KYC" component={KycScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

// Stack screens for Credit Cards, Fixed Deposits, KYC (accessed from Settings)

function RootNavigator() {
    const { isAuthenticated, restoreUser } = useAuth();
    const { C } = useTheme();
    const [isRestoring, setIsRestoring] = useState(true);

    useEffect(() => {
        restoreUser().finally(() => setIsRestoring(false));
    }, []);

    if (isRestoring) {
        return (
            <View style={[styles.splashContainer, { backgroundColor: C.primary }]}>
                <Text style={styles.splashLogo}>🏦</Text>
                <Text style={styles.splashTitle}>DemoBank</Text>
                <ActivityIndicator color="#fff" style={{ marginTop: 24 }} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                <>
                    <Stack.Screen name="Dashboard" component={DashboardTabs} />
                    <Stack.Screen
                        name="QRScanner"
                        component={QRScannerScreen}
                        options={{ animation: 'slide_from_bottom' }}
                    />
                </>
            ) : (
                <Stack.Screen name="Login" component={LoginScreen} />
            )}
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <AuthProvider>
                    <ThemeProvider>
                        <NavigationContainer>
                            <RootNavigator />
                        </NavigationContainer>
                    </ThemeProvider>
                </AuthProvider>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    splashContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    splashLogo: { fontSize: 64, marginBottom: 12 },
    splashTitle: {
        ...FONTS.extraBold,
        fontSize: 36,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
