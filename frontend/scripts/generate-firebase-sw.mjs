import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
dotenv.config({ path: ".env.local" });
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  throw new Error(
    "NEXT_PUBLIC_FIREBASE_API_KEY is not configured."
  );
}

const outputPath = path.join(
  process.cwd(),
  "public",
  "firebase-messaging-sw.js"
);

const firebaseConfig = {
  apiKey,
  authDomain: "campusvita.firebaseapp.com",
  projectId: "campusvita",
  storageBucket: "campusvita.firebasestorage.app",
  messagingSenderId: "1044650280683",
  appId: "1:1044650280683:web:714ea86da19398ea9820ae",
  measurementId: "G-CK2BVJ0MVJ",
};

const configText = JSON.stringify(firebaseConfig, null, 2);

const serviceWorker = `/* ============================================================
   FIREBASE SERVICE WORKER
   ============================================================ */

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp(${configText});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message:",
    payload
  );

  const notificationTitle =
    payload.notification?.title || "CampusVita";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "You have a new CampusVita notification.",
    icon: "/images/campusvita-logo.png",
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});
`;

fs.writeFileSync(outputPath, serviceWorker, "utf8");

console.log("✅ Firebase service worker generated successfully.");
