import { getApp } from '@react-native-firebase/app';
import { getMessaging, FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import messaging from '@react-native-firebase/messaging';  // Keep this import for types
import { useEffect } from "react"
import { Alert, PermissionsAndroid, Platform } from "react-native"
import Toast from 'react-native-toast-message';

export const usePushNotifications = () => {
  const messagingLocal = getMessaging(getApp());
  
  const requestPermission = async () => {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      )

      if (!hasPermission) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        )

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          // console.warn("Push notification permissions are not granted.")
          return false
        }
      }
    }

    const authStatus = await messagingLocal.requestPermission()
    const isAuthorized =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL

    if (!isAuthorized) {
      // console.warn("Push notification permissions are not granted.")
    }
    return isAuthorized
  }

  const handleNotificationData = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const data = remoteMessage.data;
    if (!data) return;

    // Using the global queryClient reference from hooks/useWebSocket.ts
    const { globalQueryClient } = require('../hooks/useWebSocket');
    
    // Check if globalQueryClient is available
    if (!globalQueryClient) return;

    // Handle notification based on type
    if (data.type === 'cashier') {
      // Invalidate cashier orders query to trigger a refetch
      globalQueryClient.invalidateQueries({ queryKey: ['cashier-orders'] });
    } else if (data.type === 'client') {
      // Invalidate client orders query to trigger a refetch
      globalQueryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  }

  const handleForegroundNotification = () => {
    const unsubscribe = messagingLocal.onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      // Show toast notification
      Toast.show({
        type: 'tomatoToast',
        text1: `${remoteMessage.notification?.title}`,
        position: 'top'
      });
      
      // Handle notification data
      handleNotificationData(remoteMessage);
    })
    return unsubscribe
  }

  const handleBackgroundNotifications = () => {
    messagingLocal.setBackgroundMessageHandler(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      // Handle notification data
      handleNotificationData(remoteMessage);
    })

    messagingLocal.onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      // Handle notification data
      handleNotificationData(remoteMessage);
    })

    messagingLocal.getInitialNotification()
      .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (remoteMessage) {
          // Handle notification data
          handleNotificationData(remoteMessage);
        }
      })
  }

  useEffect(() => {
    let unsubscribe: () => void;
    
    (async () => {
      try {
        const hasPermission = await requestPermission()
        if (!hasPermission) return
        
        handleBackgroundNotifications()
        unsubscribe = handleForegroundNotification()
      } catch (error) {
        // console.error('Error setting up notifications:', error)
      }
    })()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])
}

export const getFCMToken = async () => {
  const messaging = getMessaging(getApp());
  try {
    if (Platform.OS === "ios") {
      const apnsToken = await messaging.getAPNSToken()
      if (!apnsToken) {
        // console.warn("APNs token is null. Check APNs setup.")
        return
      }
      // console.log("APNs Token:", apnsToken)
    }

    const fcmToken = await messaging.getToken()
    // console.log("FCM Token:", fcmToken)
    return fcmToken
  } catch (error) {
    // console.error("Error fetching push notification token:", error)
  }
}

export const saveTokenToServer = async (token: string, accessToken: string) => {
  try {
    const response = await fetch('https://dev-refill.kz/backend/0e885b3a-905f-4ce3-8881-1369c323b7ad/api/v1/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ fcmToken: token })
    });

    if (!response.ok) {
      throw new Error(await response.text())
    }
  } catch (error) {
    // console.error("Error saving token to server:", error);
    // Don't block login if token registration fails
  }
};