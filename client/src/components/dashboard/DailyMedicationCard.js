import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import './DailyMedicationCard.css';

const DailyMedicationCard = ({ medicamentos, historico, onToggleToma }) => {
    const hoje = new Date().toISOString().split('T')[0];
    const historicoDeHoje = (historico && historico[hoje]) || {};

    // Filtra apenas os medicamentos que têm doses agendadas para hoje
    const medicamentosDeHoje = medicamentos.filter(med => {
        if (med.status !== 'Ativo') return false;
        if (med.frequencia.tipo === 'Diária' && med.frequencia.horarios?.length > 0) return true;
        if (med.frequencia.tipo === 'Semanal' && med.frequencia.diaDaSemana === new Date().getDay()) return true;
        return false;
    });

    return (
        <Card className="dashboard-card daily-med-card">
            <div className="card-header">
                <h3><span className="card-icon">💊</span> Medicação de Hoje</h3>
            </div>
            {medicamentosDeHoje.length > 0 ? (
                <ul className="med-list">
                    {medicamentosDeHoje.map(med => {
                        const tomasDeHoje = historicoDeHoje[med._id] || 0;
                        const totalDoses = med.frequencia.horarios?.length || 0;

                        return (
                            <li key={med._id} className="med-item">
                                <div className="med-info">
                                    <strong>{med.nome}</strong>
                                    <span>{med.dosagem || `${med.quantidade} ${med.unidade}`}</span>
                                </div>
                                <div className="med-checks">
                                    {med.frequencia.horarios.map((horario, index) => {
                                        const foiTomado = index < tomasDeHoje;
                                        return (
                                            <div key={index} className="dose-item">
                                                <button
                                                    className={`med-checkbox ${foiTomado ? 'taken' : ''}`}
                                                    onClick={() => onToggleToma(med._id, totalDoses)}
                                                    aria-label={`Marcar dose das ${horario}`}
                                                >
                                                    {foiTomado && '✓'}
                                                </button>
                                                <span className="dose-time">{horario}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="summary-empty">
                    <span className="empty-icon">🎉</span>
                    <p>Nenhum medicamento agendado para hoje.</p>
                    <Link to="/medicacao" className="summary-action-btn">
                        Gerir Medicação
                    </Link>
                </div>
            )}
        </Card>
    );
};

export default DailyMedicationCard;