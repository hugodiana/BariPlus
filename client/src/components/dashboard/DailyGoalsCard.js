import React from 'react';
import './DailyGoalsCard.css';

const DailyGoalsCard = ({ log, onTrack }) => {
    const waterGoal = 2000; // 2000ml = 2L
    const proteinGoal = 60; // 60g

    const waterProgress = Math.min((log.waterConsumed / waterGoal) * 100, 100);
    const proteinProgress = Math.min((log.proteinConsumed / proteinGoal) * 100, 100);

    return (
        <div className="dashboard-card daily-goals-card">
            <h3>Metas Diárias</h3>
            <div className="goal-item">
                <div className="goal-info">
                    <span>💧 Água</span>
                    <span>{log.waterConsumed} / {waterGoal} ml</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${waterProgress}%` }}></div>
                </div>
                <div className="goal-actions">
                    <button onClick={() => onTrack('water', 250)}>+ 1 Copo (250ml)</button>
                </div>
            </div>
            <div className="goal-item">
                <div className="goal-info">
                    <span>💪 Proteína</span>
                    <span>{log.proteinConsumed} / {proteinGoal} g</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${proteinProgress}%` }}></div>
                </div>
                <div className="goal-actions">
                    <button onClick={() => onTrack('protein', 10)}>+ 10g</button>
                    <button onClick={() => onTrack('protein', 20)}>+ 20g</button>
                </div>
            </div>
        </div>
    );
};

export default DailyGoalsCard;