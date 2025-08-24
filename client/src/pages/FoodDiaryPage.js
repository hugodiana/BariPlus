// client/src/pages/FoodDiaryPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';

import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/ui/Card';
import DailySummary from '../components/food/DailySummary';
import FoodSearchModal from '../components/food/FoodSearchModal';
import CopyMealModal from '../components/food/CopyMealModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import './FoodDiaryPage.css';

const MealCard = ({ title, items = [], onAdd, onDelete, onCopy, mealType }) => {
    return (
        <Card className="meal-card">
            <div className="meal-header">
                <h3>{title}</h3>
                <div className="meal-actions">
                    <button onClick={() => onCopy(mealType)} className="icon-btn" title="Copiar refeição de outro dia">
                        <FontAwesomeIcon icon={faCopy} />
                    </button>
                    <button onClick={() => onAdd(mealType)} className="add-food-btn">+</button>
                </div>
            </div>
            <ul className="food-list">
                {items.length > 0 ? items.map(item => (
                    <li key={item._id || item.name + Math.random()}>
                        <div className="food-info">
                            <span className="food-name">{item.name}</span>
                            <span className="food-portion">{item.portion}g</span>
                        </div>
                        <div className="food-macros">
                            <span>{Math.round(item.nutrients.calories)} kcal</span>
                            <button onClick={() => onDelete(mealType, item._id)} className="delete-food-btn">×</button>
                        </div>
                    </li>
                )) : <p className="empty-meal">Nenhum alimento registado.</p>}
            </ul>
        </Card>
    );
};


const FoodDiaryPage = () => {
    const { user } = useAuth();
    const { isLoading, request } = useApi();
    const [date, setDate] = useState(new Date());
    const [diary, setDiary] = useState(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [editingMealType, setEditingMealType] = useState(null);

    const dateString = format(date, 'yyyy-MM-dd');

    const fetchDiary = useCallback(async (currentDate) => {
        try {
            const data = await request(`/api/food-diary/${currentDate}`);
            setDiary(data);
        } catch (error) {
            setDiary({ refeicoes: {} });
        }
    }, [request]);

    useEffect(() => {
        fetchDiary(dateString);
    }, [dateString, fetchDiary]);

    const changeDate = (amount) => {
        setDate(currentDate => amount > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1));
    };
    
    const handleOpenSearchModal = (mealType) => {
        setEditingMealType(mealType);
        setIsSearchModalOpen(true);
    };

    const handleOpenCopyModal = (mealType) => {
        setEditingMealType(mealType);
        setIsCopyModalOpen(true);
    };

    const handleAddFood = async (mealType, food) => {
        try {
            const updatedDiary = await request('/api/food-diary/log', {
                method: 'POST',
                body: JSON.stringify({ date: dateString, mealType, food })
            });
            setDiary(updatedDiary);
        } catch (error) { /* O hook já trata o erro */ }
    };
    
    const handleDeleteFood = async (mealType, itemId) => {
        if (!window.confirm("Tem a certeza?")) return;
        try {
            await request(`/api/food-diary/log/${dateString}/${mealType}/${itemId}`, { method: 'DELETE' });
            fetchDiary(dateString);
        } catch(error) { /* O hook já trata o erro */ }
    }

    const handleCopyMeal = async (mealType, fromDate) => {
        const fromDateString = format(fromDate, 'yyyy-MM-dd');
        try {
            const sourceDiary = await request(`/api/food-diary/${fromDateString}`);
            const itemsToCopy = sourceDiary?.refeicoes?.[mealType];

            if (!itemsToCopy || itemsToCopy.length === 0) {
                toast.info("Não há alimentos para copiar nesta data.");
                return;
            }

            for (const item of itemsToCopy) {
                const { _id, ...foodData } = item;
                await handleAddFood(mealType, foodData);
            }
            
            toast.success(`Refeição copiada com sucesso!`);
            await fetchDiary(dateString);
        } catch (error) {
            toast.error("Não foi possível copiar a refeição.");
        }
    };

    const dailyTotals = useMemo(() => {
        if (!diary || !diary.refeicoes) return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
        return Object.values(diary.refeicoes).flat().reduce((acc, item) => {
            acc.calories += item.nutrients.calories || 0;
            acc.proteins += item.nutrients.proteins || 0;
            acc.carbs += item.nutrients.carbs || 0;
            acc.fats += item.nutrients.fats || 0;
            return acc;
        }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });
    }, [diary]);

    const userGoals = useMemo(() => ({
        metaProteinaDiaria: user?.metaProteinaDiaria || 60,
        metaCarboidratos: user?.metaCarboidratos || 100,
        metaGorduras: user?.metaGorduras || 40,
        metaCalorias: user?.metaCalorias || 1200,
    }), [user]);

    if (!diary) { return <LoadingSpinner fullPage />; }

    return (
        <div className="page-container">
            <div className="page-header date-selector">
                <button onClick={() => changeDate(-1)} disabled={isLoading}>&lt;</button>
                <h1>{format(date, "'Diário de' dd 'de' MMMM", { locale: ptBR })}</h1>
                <button onClick={() => changeDate(1)} disabled={isLoading}>&gt;</button>
            </div>
            
            <DailySummary totals={dailyTotals} goals={userGoals} />
            {isLoading && <LoadingSpinner />}
            <div className="diary-grid" style={{ opacity: isLoading ? 0.5 : 1 }}>
                <MealCard title="Café da Manhã" mealType="cafeDaManha" items={diary?.refeicoes?.cafeDaManha} onAdd={handleOpenSearchModal} onDelete={handleDeleteFood} onCopy={handleOpenCopyModal} />
                <MealCard title="Almoço" mealType="almoco" items={diary?.refeicoes?.almoco} onAdd={handleOpenSearchModal} onDelete={handleDeleteFood} onCopy={handleOpenCopyModal} />
                <MealCard title="Jantar" mealType="jantar" items={diary?.refeicoes?.jantar} onAdd={handleOpenSearchModal} onDelete={handleDeleteFood} onCopy={handleOpenCopyModal} />
                <MealCard title="Lanches" mealType="lanches" items={diary?.refeicoes?.lanches} onAdd={handleOpenSearchModal} onDelete={handleDeleteFood} onCopy={handleOpenCopyModal} />
            </div>
            <FoodSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} onFoodSelect={handleAddFood} mealType={editingMealType} />
            <CopyMealModal isOpen={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} onCopy={handleCopyMeal} mealType={editingMealType} />
        </div>
    );
};

export default FoodDiaryPage;