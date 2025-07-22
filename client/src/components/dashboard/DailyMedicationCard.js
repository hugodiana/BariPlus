import React from 'react';
import './DailyMedicationCard.css';

const DailyMedicationCard = ({ medicamentos, historico, onToggleToma }) => {
    const hoje = new Date().toISOString().split('T')[0];
    const historicoDeHoje = (historico && historico[hoje]) || {};

    return (
        <div className="dashboard-card daily-med-card">
            <h3>Medicação de Hoje</h3>
            {(!medicamentos || medicamentos.length === 0) && <p className="empty-meds">Nenhum medicamento na sua lista.</p>}
            {medicamentos && medicamentos.map(med => {
                const tomasDeHoje = historicoDeHoje[med._id] || 0;
                // ✅ CORREÇÃO: Criamos um array de checks para cada dose
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
                                    // ✅ CORREÇÃO: O onClick agora funciona corretamente
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