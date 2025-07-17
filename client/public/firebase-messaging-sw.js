// Importa os scripts do Firebase
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

// TODO: Substitua isto pela configuração do seu projeto Firebase (a mesma do outro arquivo)
const firebaseConfig = {
  apiKey: "AIzaSyA8VGd-YuW5v1N8eaDZQSg5ZB79Ou_BxcA",
  authDomain: "bariplus-app.firebaseapp.com",
  projectId: "bariplus-app",
  storageBucket: "bariplus-app.firebasestorage.app",
  messagingSenderId: "455694587341",
  appId: "1:455694587341:web:96692894cc88c24c68e084"
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