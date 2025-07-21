import React from 'react';
import PropTypes from 'prop-types'; // ✅ Adicionar validação de props
import './DailyGoalsCard.css';

const DailyGoalsCard = ({ log = { waterConsumed: 0, proteinConsumed: 0 }, onTrack }) => {
    // Valores padrão diretamente na desestruturação
    const { waterConsumed = 0, proteinConsumed = 0 } = log;

    // Metas configuráveis (poderiam vir por props)
    const GOALS = {
        water: 2000, // ml
        protein: 60  // g
    };

    // Função reutilizável para cálculo de progresso
    const getProgress = (consumed, goal) => Math.min((consumed / goal) * 100, 100);

    return (
        <div className="dashboard-card daily-goals-card">
            <h3>Metas Diárias</h3>
            
            {/* Água */}
            <GoalItem
                type="water"
                consumed={waterConsumed}
                goal={GOALS.water}
                progress={getProgress(waterConsumed, GOALS.water)}
                onTrack={onTrack}
                icon="💧"
                unit="ml"
                actions={[
                    { label: "+ 1 Copo (250ml)", amount: 250 }
                ]}
            />
            
            {/* Proteína */}
            <GoalItem
                type="protein"
                consumed={proteinConsumed}
                goal={GOALS.protein}
                progress={getProgress(proteinConsumed, GOALS.protein)}
                onTrack={onTrack}
                icon="💪"
                unit="g"
                actions={[
                    { label: "+ 10g", amount: 10 },
                    { label: "+ 20g", amount: 20 }
                ]}
            />
        </div>
    );
};

// Componente interno reutilizável
const GoalItem = ({ type, icon, consumed, goal, unit, progress, actions, onTrack }) => (
    <div className="goal-item">
        <div className="goal-info">
            <span>{icon} {type === 'water' ? 'Água' : 'Proteína'}</span>
            <span>{consumed} / {goal} {unit}</span>
        </div>
        <div className="progress-bar-container">
            <div 
                className="progress-bar" 
                style={{ 
                    width: `${progress}%`,
                    backgroundColor: progress >= 100 ? '#4CAF50' : '#007aff' // Verde se completado
                }} 
            />
        </div>
        <div className="goal-actions">
            {actions.map((action, index) => (
                <button 
                    key={index}
                    onClick={() => onTrack(type, action.amount)}
                    aria-label={`Adicionar ${action.amount}${unit} de ${type}`}
                >
                    {action.label}
                </button>
            ))}
        </div>
    </div>
);

// Validação de props
DailyGoalsCard.propTypes = {
    log: PropTypes.shape({
        waterConsumed: PropTypes.number,
        proteinConsumed: PropTypes.number
    }),
    onTrack: PropTypes.func.isRequired
};

export default DailyGoalsCard;