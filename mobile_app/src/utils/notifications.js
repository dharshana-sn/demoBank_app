import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

export async function registerForPushNotificationsAsync() {
    if (isExpoGo) {
        console.warn('Push notifications are not supported in Expo Go. Use a production build.');
        return null;
    }

    if (!Device.isDevice) {
        console.warn('Push Notifications are only supported on physical devices.');
        return null;
    }

    const Notifications = require('expo-notifications');

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
        console.error('Project ID not found in app.config.js or app.json');
    }

    try {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Expo Push Token:', token);

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
        console.error('Error fetching push token:', e);
        return null;
    }
}

export function setupNotificationHandler() {
    if (isExpoGo) return;

    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}
