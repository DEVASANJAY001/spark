import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const notificationService = {
    registerForPushNotificationsAsync: async (userId) => {
        let token;

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }
            token = (await Notifications.getExpoPushTokenAsync({
                projectId: '78bec517-6705-479e-af05-a47c52fa49a6' 
            })).data;
            
            if (userId && token) {
                await updateDoc(doc(db, 'users', userId), {
                    pushToken: token
                });
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    },

    addListener: (onNotification) => {
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            onNotification(notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            // Handle navigation here if needed
            console.log('Notification clicked:', data);
        });

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }
};
