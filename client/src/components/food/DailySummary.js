// client/src/components/food/DailySummary.js
import React from 'react';
import './DailySummary.css';

const ProgressBar = ({ value, max, label, color }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const barColor = color || '#37715b';
    
    return (
        <div className="progress-bar-container">
            <div className="progress-bar-labels">
                <span>{label}</span>
                <span>{Math.round(value)}g / {max}g</span>
            </div>
            <div className="progress-bar-background">
                <div 
                    className="progress-bar-foreground" 
                    style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }}
                />
            </div>
        </div>
    );
};


const DailySummary = ({ totals, goals }) => {
    return (
        <div className="daily-summary-card">
            <div className="calories-summary">
                <span className="calories-value">{Math.round(totals.calories)}</span>
                <span className="calories-label">Kcal Consumidas</span>
            </div>
            <div className="macros-summary">
                <ProgressBar 
                    value={totals.proteins} 
                    max={goals.metaProteinaDiaria} 
                    label="Proteínas" 
                    color="#00b894" 
                />
                <ProgressBar 
                    value={totals.carbs} 
                    max={goals.metaCarboidratos} 
                    label="Carboidratos" 
                    color="#0984e3" 
                />
                <ProgressBar 
                    value={totals.fats} 
                    max={goals.metaGorduras} 
                    label="Gorduras" 
                    color="#fdcb6e" 
                />
            </div>
        </div>
    );
};

export default DailySummary;