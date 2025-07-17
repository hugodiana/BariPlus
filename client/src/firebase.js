import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// TODO: Substitua isto pela configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA8VGd-YuW5v1N8eaDZQSg5ZB79Ou_BxcA",
  authDomain: "bariplus-app.firebaseapp.com",
  projectId: "bariplus-app",
  storageBucket: "bariplus-app.firebasestorage.app",
  messagingSenderId: "455694587341",
  appId: "1:455694587341:web:96692894cc88c24c68e084"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
// Exporta o serviço de mensagens para ser usado noutras partes do app
export const messaging = getMessaging(app);