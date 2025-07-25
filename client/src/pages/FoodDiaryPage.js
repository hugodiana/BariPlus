import React, { useState, useEffect, useCallback } from 'react';
import './FoodDiaryPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { formatDate, formatCurrency } from '../utils/formatHelpers';

const FoodDiaryPage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [message, setMessage] = useState('Use a barra de pesquisa para encontrar alimentos.');
    const [diary, setDiary] = useState(null);
    const [loadingDiary, setLoadingDiary] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchDiary = useCallback(async (date) => {
        setLoadingDiary(true);
        try {
            const res = await fetch(`${apiUrl}/api/food-diary/${date}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Falha ao carregar o diário.");
            const data = await res.json();
            setDiary(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoadingDiary(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchDiary(selectedDate);
    }, [selectedDate, fetchDiary]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        setLoadingSearch(true);
        setSearchResults([]);
        setMessage('');
        try {
            const response = await fetch(`${apiUrl}/api/foods/search?query=${encodeURIComponent(searchTerm)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao buscar alimentos.');
            const data = await response.json();
            if (data.length === 0) {
                setMessage(`Nenhum resultado encontrado para "${searchTerm}".`);
            } else {
                setSearchResults(data);
            }
        } catch (error) {
            setMessage("Ocorreu um erro na busca. Tente novamente.");
        } finally {
            setLoadingSearch(false);
        }
    };
    
    const handleSelectFood = (food) => {
        setSelectedFood(food);
        setIsModalOpen(true);
    };
    
    const handleLogFood = async (mealType) => {
        if (!selectedFood) return;
        try {
            const res = await fetch(`${apiUrl}/api/food-diary/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ food: selectedFood, mealType, date: selectedDate })
            });
            const data = await res.json();
            setDiary(data);
            setIsModalOpen(false);
            setSelectedFood(null);
            setSearchResults([]);
            setSearchTerm('');
            toast.success(`${selectedFood.name} adicionado com sucesso!`);
        } catch (error) {
            toast.error("Erro ao registrar refeição.");
        }
    };

    const handleDeleteFood = async (mealType, itemId) => {
        if (!window.confirm("Tem certeza que quer apagar este item?")) return;
        try {
             await fetch(`${apiUrl}/api/food-diary/log/${selectedDate}/${mealType}/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchDiary(selectedDate);
            toast.info("Item removido do diário.");
        } catch (error) {
            toast.error("Erro ao apagar item.");
        }
    };

    const renderMealSection = (title, mealKey, mealArray) => (
        <div className="meal-section">
            <h4>{title}</h4>
            {mealArray && mealArray.length > 0 ? (
                <ul className="logged-food-list">
                    {mealArray.map((item) => (
                        <li key={item._id}>
                            <span>{item.name} <small>({item.brand})</small></span>
                            <button onClick={() => handleDeleteFood(mealKey, item._id)} className="delete-food-btn">×</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-meal">Nenhum item registrado.</p>
            )}
        </div>
    );

    if (loadingDiary) {
        return <LoadingSpinner />;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Diário Alimentar</h1>
                <p>Pesquise e registre suas refeições diárias.</p>
            </div>
            <Card>
                <div className="date-selector">
                    <label htmlFor="diary-date">Selecione a data:</label>
                    <input type="date" id="diary-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                <div className="search-container">
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Ex: Frango grelhado, maçã, etc."
                            className="search-input"
                        />
                        <button type="submit" className="search-button" disabled={loadingSearch}>
                            {loadingSearch ? 'Buscando...' : 'Pesquisar'}
                        </button>
                    </form>
                </div>
            </Card>

            <div className="results-container">
                {loadingSearch && <p className="info-message">Carregando...</p>}
                {message && !loadingSearch && searchResults.length === 0 && <p className="info-message">{message}</p>}
                {searchResults.length > 0 && (
                    <ul className="results-list">
                        {searchResults.map(food => (
                            <li key={food.id} className="result-item" onClick={() => handleSelectFood(food)}>
                                <img src={food.imageUrl || 'https://via.placeholder.com/60'} alt={food.name} className="food-image" />
                                <div className="food-info">
                                    <div className="food-name">{food.name}</div>
                                    <div className="food-brand">{food.brand}</div>
                                    <div className="food-nutrients">(por 100g) Cals: {food.nutrients.calories} | Prot: {food.nutrients.proteins}g</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Card className="diary-view">
                <h2>Refeições de {format(new Date(selectedDate.replace(/-/g, '/')), 'dd/MM/yyyy')}</h2>
                {diary && diary.refeicoes ? (
                    <div className="meals-grid">
                        {renderMealSection("Café da Manhã", "cafeDaManha", diary.refeicoes.cafeDaManha)}
                        {renderMealSection("Almoço", "almoco", diary.refeicoes.almoco)}
                        {renderMealSection("Jantar", "jantar", diary.refeicoes.jantar)}
                        {renderMealSection("Lanches", "lanches", diary.refeicoes.lanches)}
                    </div>
                ) : (
                    <p>Não foi possível carregar o diário para este dia.</p>
                )}
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedFood ? (
                    <div className="food-details-modal">
                        <h2>{selectedFood.name}</h2>
                        <div className="nutrient-details">
                            <span><strong>Calorias:</strong> {selectedFood.nutrients.calories} kcal</span>
                            <span><strong>Proteínas:</strong> {selectedFood.nutrients.proteins} g</span>
                            <span><strong>Carboidratos:</strong> {selectedFood.nutrients.carbs} g</span>
                            <span><strong>Gorduras:</strong> {selectedFood.nutrients.fats} g</span>
                        </div>
                        <p className="details-serving">Valores por 100g/100ml</p>
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