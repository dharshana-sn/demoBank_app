import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

// Expo Go on Android removed remote push notification support in SDK 53.
// Importing expo-notifications at the top level triggers the crash immediately.
// Instead, we use a lazy require() so the module is never loaded in Expo Go on Android.

function isExpoGo() {
    return Constants.executionEnvironment === 'storeClient';
}

function getNotificationsModule() {
    if (isExpoGo() && Platform.OS === 'android') {
        return null; // Do NOT import the module at all
    }
    try {
        return require('expo-notifications');
    } catch (e) {
        console.warn('[Notifications] expo-notifications not available:', e.message);
        return null;
    }
}

export async function registerForPushNotificationsAsync() {
    const Notifications = getNotificationsModule();
    if (!Notifications) {
        console.log('[Notifications] Skipped: not supported in Expo Go on Android (SDK 53+). Use a development build.');
        return null;
    }

    if (!Device.isDevice) {
        console.warn('[Notifications] Push Notifications are only supported on physical devices.');
        return null;
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('Permission needed', 'Allow push notifications to receive updates about your account.');
            return null;
        }

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            console.warn('[Notifications] Project ID not found in app.config.js or app.json');
        }

        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('[Notifications] Expo Push Token:', token);

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    } catch (e) {
        console.warn('[Notifications] Error during registration:', e.message);
        return null;
    }
}

export function setupNotificationHandler() {
    const Notifications = getNotificationsModule();
    if (!Notifications) return; // Silently skip on Expo Go Android

    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    } catch (e) {
        console.warn('[Notifications] Handler setup failed:', e.message);
    }
}
