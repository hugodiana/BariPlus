@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Cores primárias */
  --primary-green: #37715b;
  --primary-light: #e9f5f2;
  
  /* Cores de ação */
  --action-blue: #007aff;
  --danger-red: #c0392b;
  --error-light: #fceeee;
  
  /* Cores de fundo */
  --background-light: #f4f7f6;
  --background-white: #ffffff;
  
  /* Cores de texto */
  --text-dark: #2c3e50;
  --text-medium: #555555;
  --text-light: #7f8c8d;
  
  /* Bordas e sombras */
  --border-color: #e0e0e0;
  --shadow-color: rgba(0, 0, 0, 0.08);
}

/* Reset e estilos base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--background-light);
  color: var(--text-dark);
  line-height: 1.6;
}

/* Componentes reutilizáveis */
.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: var(--text-medium);
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.page-header p {
  font-size: 1.1rem;
  color: var(--text-light);
  margin: 0;
}

/* Media queries para responsividade */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .page-header p {
    font-size: 1rem;
  }
}