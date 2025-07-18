import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// TODO: Substitua isto pela configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBXSKImJpr5vlH0OEaKpwfWP_o8ihTU9Do",
  authDomain: "bariplus-oficial.firebaseapp.com",
  projectId: "bariplus-oficial",
  storageBucket: "bariplus-oficial.firebasestorage.app",
  messagingSenderId: "729631094955",
  appId: "1:729631094955:web:a8023054951fe08b2b1fee"
}
// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
// Exporta o serviço de mensagens para ser usado noutras partes do app
export const messaging = getMessaging(app);