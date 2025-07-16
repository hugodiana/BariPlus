import React, { useState, useEffect } from 'react';
import './FoodDiaryPage.css';
import Modal from '../components/Modal';

const FoodDiaryPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Pesquise por um alimento para começar.');
    
    const [diarioDeHoje, setDiarioDeHoje] = useState(null);
    const [loadingDiario, setLoadingDiario] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    const hoje = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchDiary = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/food-diary/today`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setDiarioDeHoje(data);
            } catch (error) { 
                console.error("Erro ao buscar diário:", error); 
            } finally { 
                setLoadingDiario(false); 
            }
        };
        fetchDiary();
    }, [token, apiUrl]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setSearchResults([]);
        setMessage('');

        try {
            const response = await fetch(`${apiUrl}/api/foods/search?query=${encodeURIComponent(searchTerm)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar alimentos.');
            }
            const data = await response.json();
            if (data.length === 0) {
                setMessage(`Nenhum resultado encontrado para "${searchTerm}".`);
            } else {
                setSearchResults(data);
            }
        } catch (error) {
            console.error("Erro na pesquisa:", error);
            setMessage("Ocorreu um erro ao conectar com o serviço. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleSelectFood = async (foodId) => {
        setIsModalOpen(true);
        setSelectedFood(null); 
        try {
            const res = await fetch(`${apiUrl}/api/foods/details/${foodId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setSelectedFood(data);
        } catch (error) { 
            console.error("Erro ao buscar detalhes:", error); 
            // Fecha o modal em caso de erro
            setIsModalOpen(false);
        }
    };
    
    const handleLogFood = async (mealType) => {
        if (!selectedFood) return;
        try {
            const res = await fetch(`${apiUrl}/api/food-diary/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ food: selectedFood, mealType, date: hoje })
            });
            const data = await res.json();
            setDiarioDeHoje(data); 
            setIsModalOpen(false);
            setSelectedFood(null);
            setSearchResults([]); // Limpa os resultados da busca
            setSearchTerm(''); // Limpa o campo de busca
        } catch (error) { 
            console.error("Erro ao registrar refeição:", error); 
        }
    };

    const renderMealSection = (title, mealArray) => (
        <div className="meal-section">
            <h4>{title}</h4>
            {mealArray && mealArray.length > 0 ? (
                <ul className="logged-food-list">{mealArray.map((item, i) => <li key={i}>{item.food_name}</li>)}</ul>
            ) : (
                <p className="empty-meal">Nenhum item registrado.</p>
            )}
        </div>
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Diário Alimentar</h1>
                <p>Pesquise e registre suas refeições diárias.</p>
            </div>

            <div className="food-diary-content">
                <div className="search-container">
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Ex: Frango grelhado, maçã, etc."
                            className="search-input"
                        />
                        <button type="submit" className="search-button" disabled={loading}>
                            {loading ? 'Buscando...' : 'Pesquisar'}
                        </button>
                    </form>
                </div>

                <div className="results-container">
                    {loading && <p className="info-message">Carregando...</p>}
                    {message && !loading && searchResults.length === 0 && <p className="info-message">{message}</p>}
                    
                    {searchResults.length > 0 && (
                        <ul className="results-list">
                            {searchResults.map(food => (
                                <li key={food.food_id} className="result-item" onClick={() => handleSelectFood(food.food_id)}>
                                    <div className="food-name">{food.food_name}</div>
                                    <div className="food-description">{food.food_description}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="diary-view">
                    <h2>Refeições de Hoje</h2>
                    {loadingDiario ? <p>Carregando diário...</p> : (
                        <div className="meals-grid">
                            {renderMealSection("Café da Manhã", diarioDeHoje?.refeicoes.cafeDaManha)}
                            {renderMealSection("Almoço", diarioDeHoje?.refeicoes.almoco)}
                            {renderMealSection("Jantar", diarioDeHoje?.refeicoes.jantar)}
                            {renderMealSection("Lanches", diarioDeHoje?.refeicoes.lanches)}
                        </div>
                    )}
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedFood ? (
                    <div className="food-details-modal">
                        <h2>{selectedFood.food_name}</h2>
                        <p className="details-serving">{selectedFood.servings.serving[0].serving_description}</p>
                        <div className="nutrient-details">
                            <span><strong>Calorias:</strong> {selectedFood.servings.serving[0].calories} kcal</span>
                            <span><strong>Proteínas:</strong> {selectedFood.servings.serving[0].protein} g</span>
                            <span><strong>Carboidratos:</strong> {selectedFood.servings.serving[0].carbohydrate} g</span>
                            <span><strong>Gorduras:</strong> {selectedFood.servings.serving[0].fat} g</span>
                        </div>

                        <h4>Adicionar em qual refeição?</h4>
                        <div className="meal-log-buttons">
                            <button onClick={() => handleLogFood('cafeDaManha')}>Café da Manhã</button>
                            <button onClick={() => handleLogFood('almoco')}>Almoço</button>
                            <button onClick={() => handleLogFood('jantar')}>Jantar</button>
                            <button onClick={() => handleLogFood('lanches')}>Lanches</button>
                        </div>
                    </div>
                ) : (
                    <p>Carregando detalhes do alimento...</p>
                )}
            </Modal>
        </div>
    );
};

export default FoodDiaryPage;