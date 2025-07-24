import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Estilos básicos
import './App.css';   // O nosso sistema de design global!
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);