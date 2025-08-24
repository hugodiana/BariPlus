// client/src/components/food/FoodSearchModal.js
import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../LoadingSpinner';
import '../Modal.css'; // ✅ Importar o novo CSS base
import './FoodSearchModal.css';

const FoodSearchModal = ({ isOpen, onClose, onFoodSelect, mealType }) => {
    // ... (toda a lógica do componente permanece exatamente a mesma)
    const { isLoading, request } = useApi();
    const [activeTab, setActiveTab] = useState('taco');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [nutriAlimentos, setNutriAlimentos] = useState([]);
    const [selectedFood, setSelectedFood] = useState(null);
    const [portion, setPortion] = useState(100);

    useEffect(() => {
        if (isOpen && activeTab === 'nutri' && nutriAlimentos.length === 0) {
            const fetchNutriData = async () => {
                try {
                    const alimentos = await request('/api/me/nutri-alimentos'); 
                    setNutriAlimentos(alimentos);
                } catch (error) { /* O hook lida com o erro */ }
            };
            fetchNutriData();
        }
    }, [isOpen, activeTab, request, nutriAlimentos.length]);
    
    const handleSearch = async (e) => {
        e.preventDefault();
        if (searchTerm.length < 3) return;
        try {
            const results = await request(`/api/taco/buscar?q=${searchTerm}`);
            setSearchResults(results);
        } catch (error) { /* O hook lida com o erro */ }
    };

    const handleSelectFood = (food) => {
        setSelectedFood(food);
        setPortion(100);
    };

    const handleAddFood = () => {
        if (!selectedFood) return;
        const ratio = portion / 100;
        const finalFood = {
            name: selectedFood.description,
            brand: selectedFood.brand || (activeTab === 'nutri' ? 'Personalizado' : 'Tabela TACO'),
            portion: parseFloat(portion),
            nutrients: {
                calories: (selectedFood.kcal || 0) * ratio,
                proteins: (selectedFood.protein || 0) * ratio,
                carbs: (selectedFood.carbohydrates || 0) * ratio,
                fats: (selectedFood.lipids || 0) * ratio,
            }
        };
        onFoodSelect(mealType, finalFood);
        resetModalState();
    };
    
    const resetModalState = () => {
        onClose();
        setSearchTerm('');
        setSearchResults([]);
        setSelectedFood(null);
        setPortion(100);
        setActiveTab('taco');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={resetModalState}>
            <div className="food-search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Adicionar a: {mealType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                    <button onClick={resetModalState} className="close-button">&times;</button>
                </div>
                
                {selectedFood ? (
                    <div className="modal-content portion-selection">
                        <h4>{selectedFood.description}</h4>
                        <div className="nutri-facts-preview">
                            <span>100g:</span>
                            <span><strong>{Math.round(selectedFood.kcal || 0)}</strong> kcal</span>
                            <span><strong>{Math.round(selectedFood.protein || 0)}</strong>g P</span>
                            <span><strong>{Math.round(selectedFood.carbohydrates || 0)}</strong>g C</span>
                            <span><strong>{Math.round(selectedFood.lipids || 0)}</strong>g G</span>
                        </div>
                        <div className="form-group">
                            <label>Qual a porção (em gramas)?</label>
                            <input
                                type="number"
                                value={portion}
                                onChange={(e) => setPortion(e.target.value)}
                                className="portion-input"
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setSelectedFood(null)}>Voltar à busca</button>
                            <button className="primary-btn" onClick={handleAddFood}>Adicionar</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="tab-buttons">
                            <button className={activeTab === 'taco' ? 'active' : ''} onClick={() => setActiveTab('taco')}>Buscar na Tabela</button>
                            <button className={activeTab === 'nutri' ? 'active' : ''} onClick={() => setActiveTab('nutri')}>Alimentos da Nutri</button>
                        </div>
                        <div className="modal-content">
                            {activeTab === 'taco' && (
                                <form onSubmit={handleSearch} className="search-form">
                                    <input type="text" placeholder="Buscar alimento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                    <button type="submit" disabled={isLoading}>{isLoading ? '...' : 'Buscar'}</button>
                                </form>
                            )}
                            {isLoading ? <LoadingSpinner /> : (
                                <ul className="search-results-list">
                                    {(activeTab === 'taco' ? searchResults : nutriAlimentos).map((food, index) => (
                                        <li key={index} onClick={() => handleSelectFood(food)}>
                                            <div className="food-item-name">{food.description}</div>
                                            <div className="food-item-macros">
                                                <span>{Math.round(food.kcal || 0)} kcal</span>
                                                <span>P: {Math.round(food.protein || 0)}g</span>
                                                <span>C: {Math.round(food.carbohydrates || 0)}g</span>
                                                <span>G: {Math.round(food.lipids || 0)}g</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FoodSearchModal;