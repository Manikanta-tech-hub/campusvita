importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
  );
  
  importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
  );
  
  firebase.initializeApp({
    apiKey:
      "AIzaSyDPkOCc3YWip_8hxUuhuzoBU663olZ3Kzo",
  
    authDomain:
      "campusvita-3115.firebaseapp.com",
  
    projectId: "campusvita-3115",
  
    storageBucket:
      "campusvita-3115.firebasestorage.app",
  
    messagingSenderId:
      "696780425118",
  
    appId:
      "1:696780425118:web:1f82431a017eb37454b88f",
  
    measurementId:
      "G-R7HY0DN79E",
  });
  
  const messaging =
    firebase.messaging();
  
  messaging.onBackgroundMessage(
    (payload) => {
  
      self.registration.showNotification(
        payload.notification.title,
        {
          body:
            payload.notification.body,
  
          icon: "/icon-192.png",
        }
      );
  
    }
  );