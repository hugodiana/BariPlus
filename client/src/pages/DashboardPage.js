import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import Modal from '../components/Modal';
import './DashboardPage.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardPage = () => {
    // ... (toda a lógica de useState, useEffect, e as funções handle... continuam exatamente iguais)
    const [usuario, setUsuario] = useState(null);
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoPeso, setNovoPeso] = useState('');
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchData = async () => { /* ...código existente... */ };
        fetchData();
    }, [token, apiUrl]);

    const handleRegistrarPeso = async (e) => { /* ...código existente... */ };

    if (loading || !usuario) return <div>A carregar o painel...</div>;

    const tarefasAtivas = (usuario.detalhesCirurgia?.fezCirurgia === 'sim' ? checklist.posOp : checklist.preOp) || [];
    const proximasTarefas = tarefasAtivas.filter(t => !t.concluido).slice(0, 3);
    const proximasConsultas = consultas.filter(c => new Date(c.data) >= new Date()).slice(0, 2);

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-welcome">Bem-vindo(a) de volta, {usuario.nome}!</h1>
            <div className="dashboard-grid">
                <WeightProgressCard 
                    pesoInicial={usuario.detalhesCirurgia.pesoInicial}
                    pesoAtual={usuario.detalhesCirurgia.pesoAtual}
                />
                
                {/* O DailyGoalsCard continua aqui, se já o tiver adicionado */}
                {/* <DailyGoalsCard log={dailyLog} onTrack={handleTrack} /> */}

                <div className="dashboard-card quick-actions-card">
                    <h3>Ações Rápidas</h3>
                    <button className="quick-action-btn" onClick={() => setIsModalOpen(true)}>Registar Novo Peso</button>
                    <Link to="/consultas" className="quick-action-btn">Agendar Consulta</Link>
                    <Link to="/checklist" className="quick-action-btn">Ver Checklist Completo</Link>
                </div>

                <div className="dashboard-card summary-card">
                    <h3>Próximas Tarefas</h3>
                    {proximasTarefas.length > 0 ? (
                        <ul className="summary-list">
                            {proximasTarefas.map(task => <li key={task._id}>{task.descricao}</li>)}
                        </ul>
                    ) : (
                        // NOVIDADE: Mensagem vazia com um link de ação
                        <div className="summary-empty">
                            <p>Nenhuma tarefa pendente! ✨</p>
                            <Link to="/checklist" className="summary-action-btn">Adicionar Tarefa</Link>
                        </div>
                    )}
                </div>

                <div className="dashboard-card summary-card">
                    <h3>Próximas Consultas</h3>
                    {proximasConsultas.length > 0 ? (
                        <ul className="summary-list">
                            {proximasConsultas.map(consulta => (
                                <li key={consulta._id}>
                                    <strong>{consulta.especialidade}</strong> - {format(new Date(consulta.data), "dd/MM/yyyy 'às' p", { locale: ptBR })}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        // NOVIDADE: Mensagem vazia com um link de ação
                        <div className="summary-empty">
                            <p>Nenhuma consulta agendada.</p>
                            <Link to="/consultas" className="summary-action-btn">Agendar Consulta</Link>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {/* ... (conteúdo do Modal) ... */}
            </Modal>
        </div>
    );
};
export default DashboardPage;