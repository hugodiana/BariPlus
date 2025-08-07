import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format, parseISO, addDays, subDays } from 'date-fns';
import './FoodDiaryPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import BuscaAlimentos from '../components/BuscaAlimentos';

const FoodDiaryPage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [diary, setDiary] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Estados do Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mealTypeToLog, setMealTypeToLog] = useState('');
    const [foodToLog, setFoodToLog] = useState(null);
    const [portion, setPortion] = useState(100);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchDiary = useCallback(async (date) => {
        setLoading(true);
        try {
            const dateString = format(date, 'yyyy-MM-dd');
            const res = await fetch(`${apiUrl}/api/food-diary/${dateString}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Falha ao carregar o diário.");
            const data = await res.json();
            setDiary(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => { fetchDiary(selectedDate); }, [selectedDate, fetchDiary]);

    const handleOpenModal = (mealType) => {
        setMealTypeToLog(mealType);
        setFoodToLog(null);
        setPortion(100);
        setIsModalOpen(true);
    };

    const handleSelectFood = (food) => {
        setFoodToLog(food);
    };
    
    const handleLogFood = async () => {
        if (!foodToLog || !mealTypeToLog) return;
        
        // Calcula os nutrientes com base na porção
        const ratio = portion / 100;
        const finalNutrients = {
            calories: (foodToLog.kcal || 0) * ratio,
            proteins: (foodToLog.protein || 0) * ratio,
            carbs: (foodToLog.carbohydrates || 0) * ratio,
            fats: (foodToLog.lipids || 0) * ratio,
        };
        
        const foodDataToSave = {
            name: foodToLog.description,
            brand: foodToLog.base_unit,
            portion: Number(portion),
            nutrients: finalNutrients,
        };
        
        try {
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            const res = await fetch(`${apiUrl}/api/food-diary/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ food: foodDataToSave, mealType: mealTypeToLog, date: dateString })
            });
            if (!res.ok) throw new Error("Falha ao registrar alimento.");

            const updatedDiary = await res.json();
            setDiary(updatedDiary);
            setIsModalOpen(false);
            toast.success(`${foodDataToSave.name} adicionado com sucesso!`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDeleteFood = async (mealType, itemId) => {
        if (!window.confirm("Tem certeza que quer apagar este item?")) return;
        try {
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            await fetch(`${apiUrl}/api/food-diary/log/${dateString}/${mealType}/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchDiary(selectedDate); // Recarrega o diário para o dia
            toast.info("Item removido do diário.");
        } catch (error) {
            toast.error("Erro ao apagar item.");
        }
    };

    const changeDate = (amount) => {
        setSelectedDate(current => amount > 0 ? addDays(current, 1) : subDays(current, 1));
    };

    const renderMealSection = (title, mealKey, mealArray) => (
        <Card className="meal-card">
            <div className="meal-header">
                <h4>{title}</h4>
                <button className="add-food-btn" onClick={() => handleOpenModal(mealKey)}>+</button>
            </div>
            {mealArray && mealArray.length > 0 ? (
                <ul className="logged-food-list">
                    {mealArray.map((item) => (
                        <li key={item._id}>
                            <div className="item-info">
                                <span>{item.name} <small>({item.portion}g)</small></span>
                                <small className="item-nutrients">
                                    Kcal: {item.nutrients.calories.toFixed(0)} | P: {item.nutrients.proteins.toFixed(1)}g
                                </small>
                            </div>
                            <button onClick={() => handleDeleteFood(mealKey, item._id)} className="delete-food-btn">×</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-meal">Nenhum item registrado.</p>
            )}
        </Card>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Diário Alimentar</h1>
                <p>Pesquise e registre suas refeições diárias.</p>
            </div>
            
            <Card className="date-selector-card">
                <button onClick={() => changeDate(-1)}>‹ Dia Anterior</button>
                <input type="date" value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(parseISO(e.target.value))} />
                <button onClick={() => changeDate(1)}>Próximo Dia ›</button>
            </Card>
            
            <div className="meals-grid">
                {diary && diary.refeicoes ? (
                    <>
                        {renderMealSection("Café da Manhã", "cafeDaManha", diary.refeicoes.cafeDaManha)}
                        {renderMealSection("Almoço", "almoco", diary.refeicoes.almoco)}
                        {renderMealSection("Jantar", "jantar", diary.refeicoes.jantar)}
                        {renderMealSection("Lanches", "lanches", diary.refeicoes.lanches)}
                    </>
                ) : (
                    <p>Não foi possível carregar o diário para este dia.</p>
                )}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {!foodToLog ? (
                    <BuscaAlimentos onSelectAlimento={handleSelectFood} />
                ) : (
                    <div className="portion-container">
                        <h3>{foodToLog.description}</h3>
                        <p className="nutrient-details">
                            Valores por 100g: 
                            Kcal: {foodToLog.kcal.toFixed(0)} | 
                            P: {foodToLog.protein.toFixed(1)}g | 
                            C: {foodToLog.carbohydrates.toFixed(1)}g | 
                            G: {foodToLog.lipids.toFixed(1)}g
                        </p>
                        <div className="portion-input-group">
                            <label htmlFor="portion">Qual a porção (em gramas)?</label>
                            <input
                                id="portion"
                                type="number"
                                value={portion}
                                onChange={(e) => setPortion(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="portion-actions">
                            <button className="back-btn" onClick={() => setFoodToLog(null)}>‹ Voltar à Busca</button>
                            <button className="log-btn" onClick={handleLogFood}>Adicionar à Refeição</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FoodDiaryPage;