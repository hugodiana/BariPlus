import React, { useState, useEffect } from 'react';
import './FoodDiaryPage.css';
import Modal from '../components/Modal';

const FoodDiaryPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Pesquise por um alimento para começar.');
    
    // Estados para o diário
    const [diarioDeHoje, setDiarioDeHoje] = useState(null);
    const [loadingDiario, setLoadingDiario] = useState(true);

    // Estados para o modal de detalhes
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    const hoje = new Date().toISOString().split('T')[0];

    // Busca o diário do dia ao carregar a página
    useEffect(() => {
        const fetchDiary = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/food-diary/today`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setDiarioDeHoje(data);
            } catch (error) { console.error("Erro ao buscar diário:", error); } 
            finally { setLoadingDiario(false); }
        };
        fetchDiary();
    }, [token, apiUrl]);

    const handleSearch = async (e) => { /* ... sua função de busca continua igual ... */ };
    
    const handleSelectFood = async (foodId) => {
        // Abre o modal com os detalhes do alimento clicado
        try {
            const res = await fetch(`${apiUrl}/api/foods/details/${foodId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setSelectedFood(data);
            setIsModalOpen(true);
        } catch (error) { console.error("Erro ao buscar detalhes:", error); }
    };
    
    const handleLogFood = async (mealType) => {
        // Lógica para salvar o alimento na refeição escolhida
        if (!selectedFood) return;
        try {
            const res = await fetch(`${apiUrl}/api/food-diary/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ food: selectedFood, mealType, date: hoje })
            });
            const data = await res.json();
            setDiarioDeHoje(data); // Atualiza o diário na tela
            setIsModalOpen(false);
            setSelectedFood(null);
        } catch (error) { console.error("Erro ao registrar refeição:", error); }
    };

    return (
        <div className="page-container">
            {/* ... cabeçalho da página e formulário de busca ... */}
            <div className="results-container">
                {/* ... lógica de loading, mensagem e resultados da busca ... */}
                {searchResults.map(food => (
                    <li key={food.food_id} className="result-item" onClick={() => handleSelectFood(food.food_id)}>
                        {/* ... */}
                    </li>
                ))}
            </div>

            {/* NOVIDADE: Visualização do Diário */}
            <div className="diary-view">
                <h2>Refeições de Hoje</h2>
                {/* Aqui renderizamos cada refeição, por exemplo: */}
                <div className="meal-section">
                    <h4>Café da Manhã</h4>
                    <ul>{diarioDeHoje?.refeicoes.cafeDaManha.map((item, i) => <li key={i}>{item.food_name}</li>)}</ul>
                </div>
                {/* ... seções para almoço, jantar e lanches ... */}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedFood && (
                    <div className="food-details-modal">
                        <h2>{selectedFood.food_name}</h2>
                        {/* Mostra os detalhes nutricionais */}
                        <p>{selectedFood.servings.serving[0].serving_description}</p>
                        <p>Calorias: {selectedFood.servings.serving[0].calories}</p>
                        <p>Proteínas: {selectedFood.servings.serving[0].protein}g</p>
                        {/* ... outros detalhes ... */}

                        <h4>Adicionar em qual refeição?</h4>
                        <div className="meal-log-buttons">
                            <button onClick={() => handleLogFood('cafeDaManha')}>Café da Manhã</button>
                            <button onClick={() => handleLogFood('almoco')}>Almoço</button>
                            <button onClick={() => handleLogFood('jantar')}>Jantar</button>
                            <button onClick={() => handleLogFood('lanches')}>Lanches</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default FoodDiaryPage;