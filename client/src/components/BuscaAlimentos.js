import React, { useState } from 'react';

const BuscaAlimentos = () => {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const buscarAlimentos = async () => {
    if (termo.length < 3) {
      setErro('Digite pelo menos 3 letras.');
      return;
    }

    setCarregando(true);
    setErro('');
    try {
      const res = await fetch(`/api/taco/buscar?q=${termo}`);
      if (!res.ok) throw new Error('Erro ao buscar alimentos.');
      const dados = await res.json();
      setResultados(dados);
    } catch (e) {
      setErro('Erro ao buscar alimentos.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Buscar Alimentos (TACO)</h2>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Ex: banana, arroz, feijão..."
          className="w-full border rounded px-3 py-2"
        />
        <button
          onClick={buscarAlimentos}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Buscar
        </button>
      </div>

      {erro && <p className="text-red-500">{erro}</p>}
      {carregando && <p>Carregando...</p>}

      {resultados.length > 0 && (
        <div className="mt-4 space-y-4">
          {resultados.map((alimento, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <h3 className="font-semibold text-lg">{alimento.description}</h3>
              <p><strong>Porção:</strong> {alimento.base_unit}</p>
              <p><strong>Calorias:</strong> {alimento.kcal} kcal</p>
              <p><strong>Carboidratos:</strong> {alimento.carbohydrates} g</p>
              <p><strong>Proteínas:</strong> {alimento.protein} g</p>
              <p><strong>Gorduras:</strong> {alimento.lipids} g</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuscaAlimentos;
