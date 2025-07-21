import React from 'react';
import PropTypes from 'prop-types';

const DailyMedicationCard = ({ 
    medicamentos = [], 
    historico = {}, 
    onToggleToma 
}) => {
    const hoje = new Date().toISOString().split('T')[0];
    const historicoDeHoje = historico[hoje] || {};

    return (
        <div className="dashboard-card daily-med-card">
            <header className="med-card-header">
                <h3>Medicação de Hoje</h3>
                {medicamentos.length > 0 && (
                    <span className="meds-count">
                        {medicamentos.length} {medicamentos.length === 1 ? 'medicação' : 'medicações'}
                    </span>
                )}
            </header>

            {medicamentos.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-meds">Nenhum medicamento para hoje</p>
                    <small>Adicione medicamentos no seu painel de configurações</small>
                </div>
            ) : (
                <ul className="med-list">
                    {medicamentos.map(med => {
                        const tomasDeHoje = historicoDeHoje[med._id] || 0;
                        const totalTomas = med.vezesAoDia;
                        const progresso = totalTomas > 0 ? Math.round((tomasDeHoje / totalTomas) * 100) : 0;

                        return (
                            <li key={med._id} className="med-item">
                                <div className="med-info">
                                    <div className="med-name-dose">
                                        <strong>{med.nome}</strong>
                                        <span>{med.quantidade} {med.unidade}</span>
                                    </div>
                                    {totalTomas > 1 && (
                                        <div className="med-progress">
                                            <small>{tomasDeHoje}/{totalTomas} tomas</small>
                                            <progress 
                                                value={tomasDeHoje} 
                                                max={totalTomas}
                                                aria-label={`Progresso: ${progresso}%`}
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="med-checks">
                                    {Array.from({ length: totalTomas }).map((_, index) => (
                                        <button
                                            key={index}
                                            className={`med-checkbox ${index < tomasDeHoje ? 'taken' : ''}`}
                                            onClick={() => onToggleToma(med._id, totalTomas)}
                                            aria-label={`${index < tomasDeHoje ? 'Desmarcar' : 'Marcar'} toma ${index + 1} de ${med.nome}`}
                                        >
                                            {index < tomasDeHoje && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

DailyMedicationCard.propTypes = {
    medicamentos: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.string.isRequired,
            nome: PropTypes.string.isRequired,
            quantidade: PropTypes.number.isRequired,
            unidade: PropTypes.string.isRequired,
            vezesAoDia: PropTypes.number.isRequired
        })
    ),
    historico: PropTypes.object,
    onToggleToma: PropTypes.func.isRequired
};

export default DailyMedicationCard;