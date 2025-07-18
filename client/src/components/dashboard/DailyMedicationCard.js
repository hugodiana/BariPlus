import React from 'react';
import './DailyMedicationCard.css';

const DailyMedicationCard = ({ medicamentos, historico, onToggleToma }) => {
    const hoje = new Date().toISOString().split('T')[0];
    
    // ✅ CORREÇÃO: Garante que 'historico' nunca é nulo ou indefinido
    const historicoDeHoje = (historico && historico[hoje]) || {};
    const medList = medicamentos || [];

    return (
        <div className="dashboard-card daily-med-card">
            <h3>Medicação de Hoje</h3>
            {medList.length === 0 && <p className="empty-meds">Nenhum medicamento na sua lista.</p>}
            {medList.map(med => {
                const tomasDeHoje = historicoDeHoje[med._id] || 0;
                const checks = Array.from({ length: med.vezesAoDia }, (_, i) => i < tomasDeHoje);

                return (
                    <div key={med._id} className="daily-med-item">
                        <div className="daily-med-info">
                            <strong>{med.nome}</strong>
                            <span>{med.quantidade} {med.unidade}</span>
                        </div>
                        <div className="daily-med-checks">
                            {checks.map((checked, index) => (
                                <div 
                                    key={index} 
                                    className={`med-checkbox-daily ${checked ? 'taken' : ''}`}
                                    onClick={() => onToggleToma(med._id, med.vezesAoDia)}
                                >
                                    {checked && '✓'}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DailyMedicationCard;