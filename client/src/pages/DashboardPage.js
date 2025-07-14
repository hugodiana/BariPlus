import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard'; // Importa o novo card
import Modal from '../components/Modal';
import './DashboardPage.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardPage = () => {
    const [usuario, setUsuario] = useState(null);
    const [dailyLog, setDailyLog] = useState(null); // Estado para o log diário
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoPeso, setNovoPeso] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resMe, resDailyLog] = await Promise.all([
                    fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/dailylog/today`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                if (!resMe.ok) throw new Error('Sessão inválida');
                const dadosUsuario = await resMe.json();
                const dadosLog = await resDailyLog.json();
                setUsuario(dadosUsuario);
                setDailyLog(dadosLog);
            } catch (error) {
                console.error("Erro ao buscar dados do painel:", error);
                localStorage.removeItem('bariplus_token');
                window.location.href = '/login';
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, apiUrl]);

    const handleRegistrarPeso = async (e) => {
        e.preventDefault();
        if (!novoPeso) return;
        try {
            await fetch(`${apiUrl}/api/pesos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ peso: novoPeso })
            });
            setUsuario(prev => ({ ...prev, detalhesCirurgia: { ...prev.detalhesCirurgia, pesoAtual: parseFloat(novoPeso) } }));
            setNovoPeso('');
            setIsModalOpen(false);
        } catch (error) { console.error(error); }
    };

    const handleTrack = async (type, amount) => {
        try {
            const response = await fetch(`${apiUrl}/api/dailylog/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ type, amount })
            });
            const updatedLog = await response.json();
            setDailyLog(updatedLog); // Atualiza o estado com a resposta do servidor
        } catch (error) {
            console.error(`Erro ao registar ${type}:`, error);
        }
    };

    if (loading || !usuario || !dailyLog) return <div>A carregar o painel...</div>;

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-welcome">Bem-vindo(a) de volta, {usuario.nome}!</h1>
            <div className="dashboard-grid">
                <WeightProgressCard 
                    pesoInicial={usuario.detalhesCirurgia.pesoInicial}
                    pesoAtual={usuario.detalhesCirurgia.pesoAtual}
                />
                
                {/* Substituímos os cards antigos pelo novo */}
                <DailyGoalsCard log={dailyLog} onTrack={handleTrack} />

                <div className="dashboard-card quick-actions-card">
                    <h3>Ações Rápidas</h3>
                    <button className="quick-action-btn" onClick={() => setIsModalOpen(true)}>
                        Registar Novo Peso
                    </button>
                    <Link to="/consultas" className="quick-action-btn">
                        Agendar Consulta
                    </Link>
                    <Link to="/checklist" className="quick-action-btn">
                        Ver Checklist Completo
                    </Link>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Registar Novo Peso</h2>
                <form onSubmit={handleRegistrarPeso}>
                    <input type="number" step="0.1" className="weight-input" placeholder="Ex: 97.5" value={novoPeso} onChange={e => setNovoPeso(e.target.value)} required />
                    <button type="submit" className="submit-btn">Guardar</button>
                </form>
            </Modal>
        </div>
    );
};

export default DashboardPage;