import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { fetchApi } from '../utils/api';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import BuscaAlimentos from '../components/BuscaAlimentos';
import './FoodDiaryPage.css';

// Componente para o item de resumo de macro
const MacroSummaryItem = ({ label, consumed, goal }) => {
    const progress = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;

    return (
        <div className="summary-item">
            <div className="progress-circle" style={{background: `conic-gradient(var(--color-primary) ${progress}%, var(--color-border) 0)`}}>
                <span className="summary-value">{consumed.toFixed(0)}</span>
            </div>
            <span className="summary-label">{label}</span>
            <span className="summary-goal">Meta: {goal}</span>
        </div>
    );
};

const FoodDiaryPage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [diary, setDiary] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mealTypeToLog, setMealTypeToLog] = useState('');
    const [foodToLog, setFoodToLog] = useState(null);
    const [portion, setPortion] = useState(100);

     const fetchDiaryAndUser = useCallback(async (date) => {
        setLoading(true);
        try {
            const dateString = format(date, 'yyyy-MM-dd');
            // CORREÇÃO: Promise.all agora retorna os dados diretamente
            const [dataDiary, dataUser] = await Promise.all([
                fetchApi(`/api/food-diary/${dateString}`),
                fetchApi('/api/me')
            ]);
            setDiary(dataDiary);
            setUsuario(dataUser);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDiaryAndUser(selectedDate); }, [selectedDate, fetchDiaryAndUser]);

    const handleOpenModal = (mealType) => {
        setMealTypeToLog(mealType);
        setFoodToLog(null);
        setPortion(100);
        setIsModalOpen(true);
    };

    const handleSelectFood = (food) => setFoodToLog(food);
    
    const handleLogFood = async () => {
        if (!foodToLog || !mealTypeToLog) return;
        
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
            const res = await fetchApi(`/api/food-diary/log`, {
                method: 'POST',
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
            await fetchApi(`/api/food-diary/log/${dateString}/${mealType}/${itemId}`, {
                method: 'DELETE'
            });
            fetchDiaryAndUser(selectedDate);
            toast.info("Item removido do diário.");
        } catch (error) {
            toast.error("Erro ao apagar item.");
        }
    };

    const changeDate = (amount) => {
        setSelectedDate(current => amount > 0 ? addDays(current, 1) : subDays(current, 1));
    };
    
    const totaisDoDia = useMemo(() => {
        if (!diary?.refeicoes) return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
        return Object.values(diary.refeicoes).flat().reduce((totals, item) => {
            totals.calories += item.nutrients.calories || 0;
            totals.proteins += item.nutrients.proteins || 0;
            totals.carbs += item.nutrients.carbs || 0;
            totals.fats += item.nutrients.fats || 0;
            return totals;
        }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });
    }, [diary]);

    // ✅ CORREÇÃO: A função renderMealSection foi movida para aqui, antes do return principal.
    const renderMealSection = (title, mealKey, mealArray) => {
        const mealTotals = mealArray?.reduce((totals, item) => {
            totals.calories += item.nutrients.calories || 0;
            totals.proteins += item.nutrients.proteins || 0;
            return totals;
        }, { calories: 0, proteins: 0 }) || { calories: 0, proteins: 0 };
        
        return (
            <Card className="meal-card">
                <div className="meal-header">
                    <h4>{title}</h4>
                    <div className="meal-subtotals">
                        <span>{mealTotals.calories.toFixed(0)} kcal</span>
                        <span>{mealTotals.proteins.toFixed(1)} g Prot.</span>
                    </div>
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
                <button className="add-food-btn" onClick={() => handleOpenModal(mealKey)}>+ Adicionar Alimento</button>
            </Card>
        );
    };

    if (loading || !usuario) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Diário Alimentar</h1>
                <p>Pesquise e registre as suas refeições diárias.</p>
            </div>
            
            <Card className="date-selector-card">
                <button onClick={() => changeDate(-1)}>‹</button>
                <input type="date" value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(parseISO(e.target.value))} />
                <button onClick={() => changeDate(1)}>›</button>
            </Card>

            <Card className="macro-summary-card">
                <MacroSummaryItem label="Calorias" consumed={totaisDoDia.calories} goal={usuario.metaCalorias || 1200} />
                <MacroSummaryItem label="Proteínas (g)" consumed={totaisDoDia.proteins} goal={usuario.metaProteinaDiaria || 60} />
                <MacroSummaryItem label="Carboidratos (g)" consumed={totaisDoDia.carbs} goal={usuario.metaCarboidratos || 100} />
                <MacroSummaryItem label="Gorduras (g)" consumed={totaisDoDia.fats} goal={usuario.metaGorduras || 40} />
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
                    <div className="search-modal-content">
                        <h3>Buscar Alimento</h3>
                        <BuscaAlimentos onSelectAlimento={handleSelectFood} />
                    </div>
                ) : (
                    <div className="portion-modal-content">
                        <h3>{foodToLog.description}</h3>
                        <p className="nutrient-details">
                            Valores por 100g: 
                            Kcal: {foodToLog.kcal.toFixed(0)} | 
                            P: {foodToLog.protein.toFixed(1)}g
                        </p>
                        <div className="form-group">
                            <label htmlFor="portion">Qual a porção (em gramas)?</label>
                            <input id="portion" type="number" value={portion} onChange={(e) => setPortion(e.target.value)} autoFocus />
                        </div>
                        <div className="form-actions">
                            <button className="secondary-btn" onClick={() => setFoodToLog(null)}>‹ Voltar</button>
                            <button className="primary-btn" onClick={handleLogFood}>Adicionar</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FoodDiaryPage;