import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import Modal from '../components/Modal';
import './DashboardPage.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardPage = () => {
    const [usuario, setUsuario] = useState(null);
    const [dailyLog, setDailyLog] = useState(null);
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoPeso, setNovoPeso] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchDataSequencial = async () => {
            try {
                console.log("1. A buscar dados do utilizador (/api/me)...");
                const resMe = await fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!resMe.ok) throw new Error('Sessão inválida ao buscar /api/me');
                const dadosUsuario = await resMe.json();
                setUsuario(dadosUsuario);
                console.log("=> Sucesso ao buscar dados do utilizador.");

                console.log("2. A buscar dados do log diário (/api/dailylog/today)...");
                const resDailyLog = await fetch(`${apiUrl}/api/dailylog/today`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!resDailyLog.ok) throw new Error('Falha ao buscar log diário');
                const dadosLog = await resDailyLog.json();
                setDailyLog(dadosLog);
                console.log("=> Sucesso ao buscar log diário.");

                console.log("3. A buscar dados do checklist (/api/checklist)...");
                const resChecklist = await fetch(`${apiUrl}/api/checklist`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!resChecklist.ok) throw new Error('Falha ao buscar checklist');
                const dadosChecklist = await resChecklist.json();
                setChecklist(dadosChecklist);
                console.log("=> Sucesso ao buscar checklist.");

                console.log("4. A buscar dados das consultas (/api/consultas)...");
                const resConsultas = await fetch(`${apiUrl}/api/consultas`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!resConsultas.ok) throw new Error('Falha ao buscar consultas');
                const dadosConsultas = await resConsultas.json();
                setConsultas(dadosConsultas.sort((a, b) => new Date(a.data) - new Date(b.data)));
                console.log("=> Sucesso ao buscar consultas. Todos os dados foram carregados!");

            } catch (error) {
                console.error("ERRO DURANTE O FETCH DE DADOS:", error);
                localStorage.removeItem('bariplus_token');
                // window.location.href = '/login'; // Comentado para podermos ver o erro
            } finally {
                setLoading(false);
            }
        };

        if(token) {
            fetchDataSequencial();
        } else {
            setLoading(false);
        }
    }, [token, apiUrl]);

    // ... O resto do código (handleRegistrarPeso e o return) continua exatamente igual
    const handleRegistrarPeso = async (e) => { /* ...código existente... */ };
    if (loading || !usuario) return <div>A carregar painel...</div>;
    // ... JSX existente ...
    return (
        <div className="dashboard-container">
            {/* ... Todo o seu JSX existente vai aqui ... */}
        </div>
    );
};

export default DashboardPage;