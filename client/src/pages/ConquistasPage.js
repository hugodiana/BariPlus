import React, { useState, useEffect, useCallback } from 'react';
import './ConquistasPage.css';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';

const ConquistasPage = () => {
    const [conquistas, setConquistas] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConquistas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/conquistas'); // Simplificado
            setConquistas(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchConquistas(); }, [fetchConquistas]);
    
    if (loading) return <LoadingSpinner />;

    const desbloqueadas = conquistas.filter(c => c.desbloqueada);
    const bloqueadas = conquistas.filter(c => !c.desbloqueada);
    const totalConquistas = conquistas.length;
    const progresso = totalConquistas > 0 ? Math.round((desbloqueadas.length / totalConquistas) * 100) : 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Minhas Conquistas</h1>
                <p>A sua jornada é feita de vitórias. Celebre cada uma delas!</p>
            </div>

            <Card className="progress-summary-card">
                <h3>Progresso Total</h3>
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progresso}%` }}></div>
                </div>
                <div className="progress-details">
                    <span>{progresso}% Completo</span>
                    <span>{desbloqueadas.length} de {totalConquistas} conquistas</span>
                </div>
            </Card>

            <div className="conquistas-section">
                <h2>Desbloqueadas ({desbloqueadas.length})</h2>
                {desbloqueadas.length > 0 ? (
                    <div className="conquistas-grid">
                        {desbloqueadas.map(c => <ConquistaItem key={c.idConquista} conquista={c} />)}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>Continue a usar o app para desbloquear as suas primeiras conquistas!</p>
                    </div>
                )}
            </div>

            {bloqueadas.length > 0 && (
                <div className="conquistas-section">
                    <h2>Por Desbloquear ({bloqueadas.length})</h2>
                    <div className="conquistas-grid">
                        {bloqueadas.map(c => <ConquistaItem key={c.idConquista} conquista={c} />)}
                    </div>
                </div>
            )}
        </div>
    );
};

const ConquistaItem = ({ conquista }) => (
    <div className={`conquista-item ${conquista.desbloqueada ? 'unlocked' : 'locked'}`}>
        <div className="conquista-icon">{conquista.icone}</div>
        <div className="conquista-info">
            <h4>{conquista.nome}</h4>
            <p>{conquista.descricao}</p>
        </div>
    </div>
);

export default ConquistasPage;