/* ============================================================
   CAMPUSVITA FIREBASE PUSH SERVICE WORKER
   ============================================================ */

/*
 * Handle notification clicks BEFORE importing Firebase,
 * as recommended for Firebase Messaging service workers.
 */
self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl =
      new URL(
        "/track-order",
        self.location.origin
      ).href;

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (const client of clientList) {
            if (
              "navigate" in client &&
              "focus" in client
            ) {
              return client
                .navigate(targetUrl)
                .then(() => client.focus());
            }
          }

          if (clients.openWindow) {
            return clients.openWindow(
              targetUrl
            );
          }

          return undefined;
        })
    );
  }
);


/* ============================================================
   FIREBASE
   ============================================================ */

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);


/* ============================================================
   FIREBASE CONFIG
   ============================================================ */

firebase.initializeApp({
  apiKey:
    "REMOVED_FIREBASE_API_KEY",

  authDomain:
    "campusvita-3115.firebaseapp.com",

  projectId:
    "campusvita-3115",

  storageBucket:
    "campusvita-3115.firebasestorage.app",

  messagingSenderId:
    "696780425118",

  appId:
    "1:696780425118:web:1f82431a017eb37454b88f",

  measurementId:
    "G-R7HY0DN79E",
});


/* ============================================================
   FIREBASE MESSAGING
   ============================================================ */

const messaging =
  firebase.messaging();


/* ============================================================
   BACKGROUND PUSH
   ============================================================ */

messaging.onBackgroundMessage(
  (payload) => {
    console.log(
      "[CampusVita] Background notification:",
      payload
    );

    const title =
      payload?.notification?.title ||
      "CampusVita Order Update";

    const body =
      payload?.notification?.body ||
      "Your CampusVita order has been updated.";

    self.registration.showNotification(
      title,
      {
        body,

        icon:
          "/icon-192.png",

        badge:
          "/icon-192.png",

        tag:
          payload?.data?.order_token
            ? `campusvita-order-${payload.data.order_token}`
            : "campusvita-order",

        renotify: true,

        data: {
          url: "/track-order",

          order_token:
            payload?.data?.order_token ||
            "",
        },
      }
    );
  }
);