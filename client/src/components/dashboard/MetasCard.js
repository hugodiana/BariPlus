// src/components/dashboard/MetasCard.js
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../ui/Card';
import './MetasCard.css'; // Criaremos a seguir

const MetasCard = ({ metas }) => {
    return (
        <Card className="dashboard-card metas-card">
            <h3>🎯 Metas Definidas pelo seu Nutri</h3>
            {metas.length > 0 ? (
                <ul className="metas-list-paciente">
                    {metas.map(meta => (
                        <li key={meta._id}>
                            <p className="meta-descricao">{meta.descricao}</p>
                            <span className="meta-prazo">
                                Prazo: {format(new Date(meta.prazo), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="summary-empty">
                    <p>O seu nutricionista ainda não definiu nenhuma meta para si.</p>
                </div>
            )}
        </Card>
    );
};

export default MetasCard;