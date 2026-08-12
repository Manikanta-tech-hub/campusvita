import { initializeApp } from "firebase/app";

import {
  getMessaging,
  isSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey:
    "AIzaSyDPkOCc3YWip_8hxUuhuzoBU663olZ3Kzo",

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
};

const app = initializeApp(firebaseConfig);

export async function getFirebaseMessaging() {

  const supported = await isSupported();

  if (!supported) {

    return null;

  }

  return getMessaging(app);

}