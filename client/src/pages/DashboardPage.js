import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import DailyMedicationCard from '../components/dashboard/DailyMedicationCard';
import Modal from '../components/Modal';
import './DashboardPage.css';
import { toast } from 'react-toastify';

const DashboardPage = () => {
    const [state, setState] = useState({
        usuario: null,
        pesos: [],
        dailyLog: null,
        checklist: { preOp: [], posOp: [] },
        consultas: [],
        medicationData: { medicamentos: [], historico: {} },
        loading: true,
        isDateModalOpen: false,
        novaDataCirurgia: ''
    });

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    // Função para buscar dados do dashboard
    const fetchDashboardData = async () => {
        if (!token) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            setState(prev => ({ ...prev, loading: true }));

            const endpoints = [
                { url: '/api/me', key: 'usuario' },
                { url: '/api/dailylog/today', key: 'dailyLog' },
                { url: '/api/checklist', key: 'checklist' },
                { url: '/api/consultas', key: 'consultas' },
                { url: '/api/medication', key: 'medicationData' },
                { url: '/api/pesos', key: 'pesos' }
            ];

            const responses = await Promise.all(
                endpoints.map(endpoint => 
                    fetch(`${apiUrl}${endpoint.url}`, { 
                        headers: { 'Authorization': `Bearer ${token}` } 
                    })
                )
            );

            // Verificar se alguma resposta falhou
            const hasError = responses.some(res => !res.ok);
            if (hasError) {
                throw new Error('Alguma requisição falhou');
            }

            // Processar todas as respostas
            const data = await Promise.all(
                responses.map(res => res.json())
            );

            // Atualizar estado com os dados
            const updatedState = endpoints.reduce((acc, endpoint, index) => {
                if (endpoint.key === 'consultas' || endpoint.key === 'pesos') {
                    // Ordenar consultas e pesos por data
                    acc[endpoint.key] = data[index].sort((a, b) => new Date(a.data) - new Date(b.data));
                } else {
                    acc[endpoint.key] = data[index];
                }
                return acc;
            }, {});

            setState(prev => ({
                ...prev,
                ...updatedState,
                loading: false
            }));

        } catch (error) {
            console.error("Erro ao buscar dados do painel:", error);
            toast.error('Erro ao carregar dados do dashboard');
            if (error.message.includes('401')) {
                localStorage.removeItem('bariplus_token');
            }
            setState(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [token, apiUrl]);

    // ... (outras funções permanecem iguais)

    return (
        <div className="dashboard-page">
            <h1 className="dashboard-welcome">{getWelcomeMessage()}</h1>
            
            <div className="dashboard-grid">
                {mostrarCardAdicionarData && (
                    <div className="dashboard-card special-action-card">
                        <h3>Jornada a Começar!</h3>
                        <p>Já tem a data da sua cirurgia? Registre-a para começar a contagem regressiva!</p>
                        <button 
                            className="quick-action-btn" 
                            onClick={() => setState(prev => ({ ...prev, isDateModalOpen: true }))}
                        >
                            Adicionar Data da Cirurgia
                        </button>
                    </div>
                )}
                
                <div className="dashboard-card-wrapper">
                    <WeightProgressCard 
                        pesoInicial={state.usuario.detalhesCirurgia.pesoInicial}
                        pesoAtual={state.usuario.detalhesCirurgia.pesoAtual}
                        historico={state.pesos}
                    />
                </div>
                
                <div className="dashboard-card-wrapper">
                    {state.dailyLog && (
                        <DailyGoalsCard 
                            log={state.dailyLog} 
                            onTrack={handleTrack} 
                        />
                    )}
                </div>
                
                <div className="dashboard-card-wrapper">
                    {state.medicationData?.medicamentos?.length > 0 && (
                        <DailyMedicationCard 
                            medicamentos={state.medicationData.medicamentos}
                            historico={state.medicationData.historico || {}}
                            onToggleToma={handleToggleMedToma}
                        />
                    )}
                </div>

                <div className="dashboard-card-wrapper">
                    <div className="dashboard-card quick-actions-card">
                        <h3>Ações Rápidas</h3>
                        <Link to="/progresso" className="quick-action-btn">
                            Ver Progresso Completo
                        </Link>
                        <Link to="/consultas" className="quick-action-btn">
                            Agendar Consulta
                        </Link>
                        <Link to="/checklist" className="quick-action-btn">
                            Ver Checklist Completo
                        </Link>
                    </div>
                </div>

                <div className="dashboard-card-wrapper">
                    <div className="dashboard-card summary-card">
                        <h3>Próximas Tarefas</h3>
                        {proximasTarefas.length > 0 ? (
                            <ul className="summary-list">
                                {proximasTarefas.map(task => (
                                    <li key={task._id}>{task.descricao}</li>
                                ))}
                            </ul>
                        ) : (
                            <div className="summary-empty">
                                <p>Nenhuma tarefa pendente! ✨</p>
                                <Link to="/checklist" className="summary-action-btn">
                                    Adicionar Tarefa
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-card-wrapper">
                    <div className="dashboard-card summary-card">
                        <h3>Próximas Consultas</h3>
                        {proximasConsultas.length > 0 ? (
                            <ul className="summary-list">
                                {proximasConsultas.map(consulta => (
                                    <li key={consulta._id}>
                                        <strong>{consulta.especialidade}</strong> - {format(
                                            new Date(consulta.data), 
                                            "dd/MM/yyyy 'às' p", 
                                            { locale: ptBR }
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="summary-empty">
                                <p>Nenhuma consulta agendada.</p>
                                <Link to="/consultas" className="summary-action-btn">
                                    Agendar Consulta
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal 
                isOpen={state.isDateModalOpen} 
                onClose={() => setState(prev => ({ ...prev, isDateModalOpen: false }))}
            >
                <h2>Registrar Data da Cirurgia</h2>
                <form onSubmit={handleSetSurgeryDate}>
                    <label>Qual é a data agendada para a sua cirurgia?</label>
                    <input 
                        type="date" 
                        className="date-input" 
                        value={state.novaDataCirurgia} 
                        onChange={e => setState(prev => ({ ...prev, novaDataCirurgia: e.target.value }))} 
                        required 
                    />
                    <button type="submit" className="submit-btn">
                        Salvar Data
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default DashboardPage;