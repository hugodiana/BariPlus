import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './FoodDiaryPage.css';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

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
    const [portion, setPortion] = useState(100);

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
            setDiary({ refeicoes: {} }); // Garante que diary nunca é null
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
        setPortion(100);
        setIsModalOpen(true);
    };
    
    const handleLogFood = async (mealType) => {
        if (!selectedFood || !portion) return toast.error("Por favor, insira uma porção.");
        
        const factor = portion / 100;
        const calculatedNutrients = {
            calories: Math.round((selectedFood.nutrients.calories || 0) * factor),
            proteins: parseFloat(((selectedFood.nutrients.proteins || 0) * factor).toFixed(1)),
            carbs: parseFloat(((selectedFood.nutrients.carbs || 0) * factor).toFixed(1)),
            fats: parseFloat(((selectedFood.nutrients.fats || 0) * factor).toFixed(1)),
        };

        const foodToLog = {
            name: selectedFood.name,
            brand: selectedFood.brand,
            portion: portion,
            nutrients: calculatedNutrients,
        };

        try {
            const res = await fetch(`${apiUrl}/api/food-diary/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ food: foodToLog, mealType, date: selectedDate })
            });
            if (!res.ok) throw new Error("Falha ao registrar refeição.");
            
            toast.success(`${selectedFood.name} adicionado com sucesso!`);
            setIsModalOpen(false);
            fetchDiary(selectedDate);
        } catch (error) { toast.error(error.message); }
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

    const renderMealSection = (title, mealKey, mealArray = []) => (
        <div className="meal-section">
            <h4>{title}</h4>
            {mealArray.length > 0 ? (
                <ul className="logged-food-list">
                    {mealArray.map((item) => (
                        <li key={item._id}>
                            <div className="logged-food-info">
                                <span>{item.name} <small>({item.portion}g)</small></span>
                                <small className="logged-food-nutrients">
                                    Cals: {item.nutrients.calories} | P: {item.nutrients.proteins}g
                                </small>
                            </div>
                            <button onClick={() => handleDeleteFood(mealKey, item._id)} className="delete-food-btn">×</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-meal">Nenhum item registrado.</p>
            )}
        </div>
    );

    const calculatedNutrientsForModal = useMemo(() => {
        if (!selectedFood || !portion) return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
        const factor = parseFloat(portion) / 100;
        return {
            calories: Math.round((selectedFood.nutrients.calories || 0) * factor),
            proteins: ((selectedFood.nutrients.proteins || 0) * factor).toFixed(1),
            carbs: ((selectedFood.nutrients.carbs || 0) * factor).toFixed(1),
            fats: ((selectedFood.nutrients.fats || 0) * factor).toFixed(1),
        };
    }, [selectedFood, portion]);

    if (loadingDiary) return <LoadingSpinner />;

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
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Ex: Frango grelhado, maçã, etc." className="search-input" />
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
                <h2>Refeições de {format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: ptBR })}</h2>
                <div className="meals-grid">
                    {renderMealSection("Café da Manhã", "cafeDaManha", diary?.refeicoes?.cafeDaManha)}
                    {renderMealSection("Almoço", "almoco", diary?.refeicoes?.almoco)}
                    {renderMealSection("Jantar", "jantar", diary?.refeicoes?.jantar)}
                    {renderMealSection("Lanches", "lanches", diary?.refeicoes?.lanches)}
                </div>
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedFood ? (
                    <div className="food-details-modal">
                        <h2>{selectedFood.name}</h2>
                        <small>{selectedFood.brand}</small>
                        <div className="portion-input">
                            <label htmlFor="portion">Porção (gramas)</label>
                            <input id="portion" type="number" value={portion} onChange={e => setPortion(e.target.value)} />
                        </div>
                        <div className="calculated-nutrients">
                            <h4>Nutrientes para {portion}g:</h4>
                            <ul>
                                <li><strong>Calorias:</strong> {calculatedNutrientsForModal.calories} kcal</li>
                                <li><strong>Proteínas:</strong> {calculatedNutrientsForModal.proteins} g</li>
                                <li><strong>Carboidratos:</strong> {calculatedNutrientsForModal.carbs} g</li>
                                <li><strong>Gorduras:</strong> {calculatedNutrientsForModal.fats} g</li>
                            </ul>
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
                    <LoadingSpinner />
                )}
            </Modal>
        </div>
    );
};

export default FoodDiaryPage;