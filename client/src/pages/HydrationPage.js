import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './HydrationPage.css';

const drinkOptions = [
    { type: 'Água', icon: '💧', amount: 250 },
    { type: 'Água', icon: '💧', amount: 500 },
    { type: 'Chá', icon: '🍵', amount: 200 },
    { type: 'Isotónico', icon: '⚡️', amount: 500 },
];

const HydrationPage = () => {
    const [log, setLog] = useState({ entries: [] });
    const [usuario, setUsuario] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (date) => {
        setLoading(true);
        const dateString = format(date, 'yyyy-MM-dd');
        try {
            // CORREÇÃO APLICADA AQUI
            const [dataLog, dataUser] = await Promise.all([
                fetchApi(`/api/hydration/${dateString}`),
                fetchApi('/api/me')
            ]);
            
            setLog(dataLog);
            setUsuario(dataUser);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate, fetchData]);

    const handleLogDrink = async (entry) => {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        try {
            const updatedLog = await fetchApi('/api/hydration/log', {
                method: 'POST',
                body: JSON.stringify({ date: dateString, entry })
            });
            setLog(updatedLog);
            toast.success(`${entry.type} adicionado!`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDeleteDrink = async (entryId) => {
        if (!window.confirm("Tem certeza que quer apagar este registo?")) return;
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        try {
            await fetchApi(`/api/hydration/log/${dateString}/${entryId}`, {
                method: 'DELETE'
            });
            fetchData(selectedDate);
            toast.info("Registo removido.");
        } catch (error) {
            toast.error("Erro ao apagar registo.");
        }
    };
    
    const changeDate = (amount) => {
        setSelectedDate(current => amount > 0 ? addDays(current, 1) : subDays(current, 1));
    };

    const totalConsumido = useMemo(() => {
        return log.entries.reduce((sum, entry) => sum + entry.amount, 0);
    }, [log.entries]);

    const metaDiaria = usuario?.metaAguaDiaria || 2000;
    const progresso = metaDiaria > 0 ? Math.min((totalConsumido / metaDiaria) * 100, 100) : 0;

    if (loading || !usuario) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Minha Hidratação</h1>
                <p>Registe todo o líquido que consome ao longo do dia.</p>
            </div>

            <Card className="date-selector-card">
                <button onClick={() => changeDate(-1)} aria-label="Dia anterior">‹</button>
                <input type="date" value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(parseISO(e.target.value))} />
                <button onClick={() => changeDate(1)} aria-label="Próximo dia">›</button>
            </Card>

            <Card className="hydration-summary-card">
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progresso}%` }}></div>
                </div>
                <div className="progress-details">
                    <span>{totalConsumido} ml</span>
                    <span>Meta: {metaDiaria} ml</span>
                </div>
            </Card>

            <Card>
                <div className="quick-add-header">
                    <h3>Adicionar Rápido</h3>
                </div>
                <div className="quick-add-grid">
                    {drinkOptions.map((drink, index) => (
                        <button key={index} className="quick-add-btn" onClick={() => handleLogDrink(drink)}>
                            <span className="drink-icon">{drink.icon}</span>
                            <span className="drink-label">{drink.type}</span>
                            <span className="drink-amount">+{drink.amount}ml</span>
                        </button>
                    ))}
                </div>
            </Card>

            <Card>
                <div className="log-history-header">
                    <h3>Histórico do Dia</h3>
                </div>
                {log.entries.length > 0 ? (
                    <ul className="log-history-list">
                        {log.entries.map(entry => (
                            <li key={entry._id}>
                                <span className="log-icon">{drinkOptions.find(d => d.type === entry.type)?.icon || '💧'}</span>
                                <div className="log-info">
                                    <strong>{entry.type}</strong>
                                    <span>{entry.amount} ml</span>
                                </div>
                                <span className="log-time">{format(parseISO(entry.timestamp), 'HH:mm')}</span>
                                <button onClick={() => handleDeleteDrink(entry._id)} className="delete-log-btn">×</button>
                            </li>
                        )).reverse()}
                    </ul>
                ) : (
                    <EmptyState message="Nenhum líquido registado para este dia." />
                )}
            </Card>
        </div>
    );
};

export default HydrationPage;