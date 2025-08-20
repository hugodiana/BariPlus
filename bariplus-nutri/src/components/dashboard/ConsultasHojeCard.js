// src/components/dashboard/ConsultasHojeCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import Card from '../ui/Card';
import './DashboardComponents.css'; // Usaremos um CSS compartilhado

const ConsultasHojeCard = ({ consultas }) => {
    return (
        <Card className="dashboard-widget">
            <h3>Consultas de Hoje</h3>
            {consultas.length > 0 ? (
                <ul className="widget-list">
                    {consultas.map(consulta => (
                        <li key={consulta._id}>
                            <span className="widget-list-time">{format(new Date(consulta.start), 'HH:mm')}</span>
                            <span className="widget-list-title">{consulta.title}</span>
                            <Link to="/agenda" className="widget-list-action">Ver Agenda</Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-message">Nenhuma consulta agendada para hoje.</p>
            )}
        </Card>
    );
};

export default ConsultasHojeCard;