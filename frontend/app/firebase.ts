import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

import {
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,

  authDomain: "campusvita.firebaseapp.com",

  projectId: "campusvita",

  storageBucket: "campusvita.firebasestorage.app",

  messagingSenderId: "1044650280683",

  appId: "1:1044650280683:web:714ea86da19398ea9820ae",

  measurementId: "G-CK2BVJ0MVJ",
};

/* =========================================================
   FIREBASE APP
========================================================= */

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

/* =========================================================
   FIREBASE AUTH
========================================================= */

export const auth = getAuth(app);

export const googleProvider =
  new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

/* =========================================================
   FIREBASE MESSAGING
========================================================= */

export async function getFirebaseMessaging() {
  const supported = await isSupported();

  if (!supported) {
    console.log(
      "Firebase Messaging is not supported"
    );

    return null;
  }

  return getMessaging(app);
}

/* =========================================================
   FCM TOKEN
========================================================= */

export async function getFCMToken() {
  try {
    console.log(
      "🔍 FCM: starting token generation"
    );

    if (typeof window === "undefined") {
      return null;
    }

    const supported = await isSupported();

    console.log(
      "🔍 FCM supported:",
      supported
    );

    if (!supported) {
      return null;
    }

    console.log(
      "🔍 VAPID configured:",
      Boolean(
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      )
    );

    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      return null;
    }

    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {
      console.log(
        "Notification permission was denied"
      );

      return null;
    }

    console.log(
      "✅ Notification permission granted"
    );

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    await navigator.serviceWorker.ready;

    console.log(
      "✅ Firebase service worker active:",
      registration.scope
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
        serviceWorkerRegistration:
          registration,
      }
    );

    if (!token) {
      console.error(
        "❌ No FCM token generated"
      );

      return null;
    }

    console.log(
      "✅ FCM token generated successfully"
    );

    return token;

  } catch (error) {
    console.error(
      "❌ Error getting FCM token:",
      error
    );

    return null;
  }
}

