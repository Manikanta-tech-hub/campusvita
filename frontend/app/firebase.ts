import { initializeApp } from "firebase/app";

import {
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDPkOCc3YWip_8hxUuhuzoBU663olZ3Kzo",

  authDomain: "campusvita-3115.firebaseapp.com",

  projectId: "campusvita-3115",

  storageBucket: "campusvita-3115.firebasestorage.app",

  messagingSenderId: "696780425118",

  appId: "1:696780425118:web:1f82431a017eb37454b88f",
};

const app = initializeApp(firebaseConfig);


export async function getFirebaseMessaging() {
  const supported = await isSupported();

  if (!supported) {
    console.log("Firebase Messaging is not supported");
    return null;
  }

  return getMessaging(app);
}


export async function getFCMToken() {
  try {
    // Browser notifications must be supported
    if (typeof window === "undefined") {
      return null;
    }

    const messaging = await getFirebaseMessaging();

    if (!messaging) {
      return null;
    }

    // Ask the real user for permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission was denied");
      return null;
    }

    // Register Firebase service worker
    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    // Get the real Firebase token for this browser/device
    const token = await getToken(messaging, {
      vapidKey:
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.log("No FCM token generated");
      return null;
    }

    console.log("FCM token generated successfully");

    return token;

  } catch (error) {
    console.error(
      "Error getting FCM token:",
      error
    );

    return null;
  }
}