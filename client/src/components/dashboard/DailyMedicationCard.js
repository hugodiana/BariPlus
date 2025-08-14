import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import './DailyMedicationCard.css';

const DailyMedicationCard = ({ medicamentos, logDoDia, onToggleToma, isReadOnly = false }) => {
    
    // ✅ CORREÇÃO: Lógica para filtrar medicamentos do dia, incluindo semanais
    const medicamentosDeHoje = medicamentos.filter(med => {
        if (med.status !== 'Ativo') return false;
        
        const hoje = new Date();
        const diaDaSemanaHoje = hoje.getDay(); // 0 = Domingo, 1 = Segunda, ...

        if (med.frequencia.tipo === 'Diária') {
            return true;
        }
        if (med.frequencia.tipo === 'Semanal' && med.frequencia.diaDaSemana === diaDaSemanaHoje) {
            return true;
        }
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
                        // A lógica para diários e semanais é a mesma: iterar sobre os horários
                        const horarios = med.frequencia.horarios || [];

                        return (
                            <li key={med._id} className="med-item">
                                <div className="med-info">
                                    <strong>{med.nome}</strong>
                                    <span>{med.dosagem || `${med.quantidade} ${med.unidade}`}</span>
                                </div>
                                <div className="med-checks">
                                    {horarios.map((horario, index) => {
                                        // ✅ CORREÇÃO: Verifica se a dose foi tomada com base no logDoDia
                                        const foiTomado = logDoDia.dosesTomadas.some(
                                            dose => dose.medicationId === med._id && dose.horario === horario
                                        );
                                        return (
                                            <div key={index} className="dose-item">
                                                <button
                                                    className={`med-checkbox ${foiTomado ? 'taken' : ''}`}
                                                    onClick={() => onToggleToma(med, horario)}
                                                    disabled={isReadOnly} // ✅ NOVO: Desativa o botão se for read-only
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