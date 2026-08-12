import {
  getToken,
  onMessage,
} from "firebase/messaging";

import { getFirebaseMessaging } from "./firebase";

export async function requestNotificationPermission() {

  try {

    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {

      console.log(
        "Notification permission denied"
      );

      return;

    }

    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {

      console.log(
        "Firebase messaging not supported"
      );

      return;

    }

    const token = await getToken(
      messaging,
      {
        vapidKey:
  "BN6BAihv2Mi7lM1ctSwSFW-GHsk4W5VCR4Ynb6JTffB4acf0FKhTTGeKC5O_dsdRA9K1DsMdAqN1H28hTPdk6bg",
      }
    );

    console.log(
      "FCM Token:",
      token
    );

  } catch (error) {

    console.error(
      "Notification error:",
      error
    );

  }

}

export async function listenNotifications() {

  const messaging =
    await getFirebaseMessaging();

  if (!messaging) return;

  onMessage(
    messaging,
    (payload) => {

      console.log(
        "Message received:",
        payload
      );

      alert(
        payload.notification?.title
      );

    }
  );

}