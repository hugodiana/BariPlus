import React, { useState, useEffect, useCallback } from 'react';
import './ConquistasPage.css';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const ConquistasPage = () => {
    const [conquistas, setConquistas] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchConquistas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/conquistas`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Falha ao carregar conquistas.");
            const data = await res.json();
            setConquistas(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => { fetchConquistas(); }, [fetchConquistas]);
    
    if (loading) return <LoadingSpinner />;

    const desbloqueadas = conquistas.filter(c => c.desbloqueada);
    const bloqueadas = conquistas.filter(c => !c.desbloqueada);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Minhas Conquistas</h1>
                <p>A sua jornada é feita de vitórias. Celebre cada uma delas!</p>
            </div>

            <Card>
                <h3>Desbloqueadas ({desbloqueadas.length})</h3>
                <div className="conquistas-grid">
                    {desbloqueadas.length > 0 ? desbloqueadas.map(c => <ConquistaItem key={c.idConquista} conquista={c} />) : <p>Continue a usar o app para desbloquear novas conquistas!</p>}
                </div>
            </Card>

            <Card>
                <h3>Por Desbloquear ({bloqueadas.length})</h3>
                <div className="conquistas-grid">
                    {bloqueadas.map(c => <ConquistaItem key={c.idConquista} conquista={c} />)}
                </div>
            </Card>
        </div>
    );
};

const ConquistaItem = ({ conquista }) => (
    <div className={`conquista-item ${conquista.desbloqueada ? 'desbloqueada' : 'bloqueada'}`}>
        <div className="conquista-icone">{conquista.icone}</div>
        <div className="conquista-info">
            <h4>{conquista.nome}</h4>
            <p>{conquista.descricao}</p>
        </div>
    </div>
);

export default ConquistasPage;