import {
  getToken,
  onMessage,
} from "firebase/messaging";

import { getFirebaseMessaging } from "./firebase";

export async function requestNotificationPermission() {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    // If permission is already granted, do NOT request it again.
    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.log("Notification permission:", permission);
      return null;
    }

    console.log("✅ Notification permission granted");

    const messaging = await getFirebaseMessaging();

    if (!messaging) {
      console.log("Firebase messaging not supported");
      return null;
    }

    const serviceWorkerRegistration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    console.log(
      "✅ Firebase service worker registered:",
      serviceWorkerRegistration.scope
    );

    const vapidKey =
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error(
        "❌ NEXT_PUBLIC_FIREBASE_VAPID_KEY is not configured"
      );
      return null;
    }

    const token = await getToken(
      messaging,
      {
        vapidKey,
        serviceWorkerRegistration,
      }
    );

    if (!token) {
      console.error("❌ FCM token was not generated");
      return null;
    }

    console.log(
      "✅ FCM token generated successfully"
    );

    return token;
  } catch (error) {
    console.error(
      "❌ Notification error:",
      error
    );

    return null;
  }
}

export async function listenNotifications() {
  try {
    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      console.log(
        "Firebase messaging not supported"
      );
      return;
    }

    onMessage(
      messaging,
      (payload) => {
        console.log(
          "🔔 Message received:",
          payload
        );

        const title =
          payload.notification?.title ||
          "CampusVita Order Update";

        const body =
          payload.notification?.body ||
          "Your CampusVita order has been updated.";

        if (
          typeof window !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification(title, {
            body,
          });
        }
      }
    );
  } catch (error) {
    console.error(
      "❌ Notification listener error:",
      error
    );
  }
}
