import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Criamos um estado para guardar a lista de tarefas.
  // O valor inicial é um array vazio [].
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    // Agora, buscamos os dados da nossa nova rota '/api/checklist'.
    fetch('http://localhost:3001/api/checklist')
      .then(response => response.json())
      .then(data => {
        // Atualizamos o estado com a lista de tarefas recebida.
        setChecklist(data);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>BariPlus</h1>
        <h2>Checklist Pré-Operatório</h2>

        {/* Aqui vamos exibir a lista */}
        <div className="checklist-container">
          <ul>
            {/* Usamos o método .map() para transformar cada item do nosso array 'checklist'
              em um elemento de lista <li>. Esta é a forma padrão do React de renderizar listas.
            */}
            {checklist.map(item => (
              <li key={item.id}>
                {item.descricao}
              </li>
            ))}
          </ul>
        </div>

      </header>
    </div>
  );
}

export default App;