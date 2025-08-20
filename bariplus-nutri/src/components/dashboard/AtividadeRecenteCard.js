// src/components/dashboard/AtividadeRecenteCard.js
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../ui/Card';
import './DashboardComponents.css'; // Reutilizando o mesmo CSS

const AtividadeRecenteCard = ({ atividades }) => {
    const renderActivityText = (atividade) => {
        switch (atividade.tipo) {
            case 'peso':
                return <><strong>{atividade.pacienteNome}</strong> registou um novo peso: {atividade.valor.toFixed(1)} kg</>;
            case 'diario':
                return <><strong>{atividade.pacienteNome}</strong> atualizou o diário alimentar.</>;
            default:
                return 'Nova atividade.';
        }
    };

    return (
        <Card className="dashboard-widget">
            <h3>Atividade Recente</h3>
            {atividades.length > 0 ? (
                <ul className="widget-list">
                    {atividades.map(atividade => (
                        <li key={`${atividade.tipo}-${atividade._id}`}>
                            <span className="widget-list-icon">
                                {atividade.tipo === 'peso' ? '⚖️' : '🥗'}
                            </span>
                            <span className="widget-list-title">
                                {renderActivityText(atividade)}
                                <small className="activity-time">
                                    {formatDistanceToNow(new Date(atividade.data), { addSuffix: true, locale: ptBR })}
                                </small>
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-message">Nenhuma atividade recente dos pacientes.</p>
            )}
        </Card>
    );
};

export default AtividadeRecenteCard;