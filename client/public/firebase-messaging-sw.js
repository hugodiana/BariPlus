// Importa os scripts do Firebase
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

// TODO: Substitua isto pela configuração do seu projeto Firebase (a mesma do outro arquivo)
const firebaseConfig = {
  apiKey: "AIzaSyBXSKImJpr5vlH0OEaKpwfWP_o8ihTU9Do",
  authDomain: "bariplus-oficial.firebaseapp.com",
  projectId: "bariplus-oficial",
  storageBucket: "bariplus-oficial.firebasestorage.app",
  messagingSenderId: "729631094955",
  appId: "1:729631094955:web:a8023054951fe08b2b1fee"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Opcional: Lógica para quando a notificação é recebida com o app em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Ícone que aparecerá na notificação
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});