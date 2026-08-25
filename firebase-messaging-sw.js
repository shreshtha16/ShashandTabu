importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBsoKZknVQVJg4uifwyB4cmlMJ9UC6yDGU",
  authDomain: "shreshthakimuskan.firebaseapp.com",
  projectId: "shreshthakimuskan",
  storageBucket: "shreshthakimuskan.firebasestorage.app",
  messagingSenderId: "94387962116",
  appId: "1:94387962116:web:0ad40298106fd5d32f1051"
});

const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
  const title=payload.notification?.title||"A note from us";
  self.registration.showNotification(title,{body:payload.notification?.body||"You have a new note."});
});
