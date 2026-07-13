import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(pushToken, message) {
    if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return;
    }

    const messages = [{
        to: pushToken,
        sound: 'default',
        title: message.title || 'Test Bank Update',
        body: message.body || 'You have a new update.',
        data: message.data || {},
    }];

    try {
        const ticketChunk = await expo.sendPushNotificationsAsync(messages);
        console.log('Push ticket:', ticketChunk);
        return ticketChunk;
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}
