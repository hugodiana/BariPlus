import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import DailyMedicationCard from '../components/dashboard/DailyMedicationCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner'; // Usando o spinner
import './DashboardPage.css';

const DashboardPage = () => {
    // Voltando à nossa estrutura original de estados separados
    const [usuario, setUsuario] = useState(null);
    const [pesos, setPesos] = useState([]);
    const [dailyLog, setDailyLog] = useState(null);
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [consultas, setConsultas] = useState([]);
    const [medicationData, setMedicationData] = useState({ medicamentos: [], historico: {} });
    const [loading, setLoading] = useState(true);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [novaDataCirurgia, setNovaDataCirurgia] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const fetchDashboardData = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const endpoints = ['me', 'dailylog/today', 'checklist', 'consultas', 'medication', 'pesos'];
            const responses = await Promise.all(
                endpoints.map(endpoint => fetch(`${apiUrl}/api/${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` } }))
            );

            for (const res of responses) {
                if (!res.ok) throw new Error('Falha ao carregar os dados do painel.');
            }

            const [dadosUsuario, dadosLog, dadosChecklist, dadosConsultas, dadosMedication, dadosPesos] = await Promise.all(responses.map(res => res.json()));

            setUsuario(dadosUsuario);
            setDailyLog(dadosLog);
            setChecklist(dadosChecklist);
            setConsultas(dadosConsultas.sort((a, b) => new Date(a.data) - new Date(b.data)));
            setMedicationData(dadosMedication);
            setPesos(dadosPesos.sort((a, b) => new Date(a.data) - new Date(b.data)));

        } catch (error) {
            toast.error(error.message);
            if (error.message.includes('401')) localStorage.removeItem('bariplus_token');
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleTrack = async (type, amount) => {
        try {
            const response = await fetch(`${apiUrl}/api/dailylog/track`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, amount })
            });

            if (!response.ok) {
                throw new Error('Falha ao registrar');
            }

            const updatedLog = await response.json();
            setState(prev => ({ ...prev, dailyLog: updatedLog }));
            toast.success('Registro atualizado!');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSetSurgeryDate = async (e) => {
        e.preventDefault();
        if (!state.novaDataCirurgia) return;

        try {
            const response = await fetch(`${apiUrl}/api/user/surgery-date`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ dataCirurgia: state.novaDataCirurgia })
            });

            if (!response.ok) {
                throw new Error('Falha ao atualizar data');
            }

            const updatedUser = await response.json();
            setState(prev => ({
                ...prev,
                usuario: updatedUser,
                isDateModalOpen: false,
                novaDataCirurgia: ''
            }));
            toast.success('Data da cirurgia atualizada!');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleToggleMedToma = async (medId, totalDoses) => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const currentCount = state.medicationData.historico[today]?.[medId] || 0;
            const newCount = currentCount < totalDoses ? currentCount + 1 : 0;

            const response = await fetch(`${apiUrl}/api/medication/log/update`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date: today, medId, count: newCount })
            });

            if (!response.ok) {
                throw new Error('Falha ao atualizar medicação');
            }

            const updatedMedication = await response.json();
            setState(prev => ({
                ...prev,
                medicationData: {
                    ...prev.medicationData,
                    historico: updatedMedication.historico
                }
            }));
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getWelcomeMessage = () => {
        if (!usuario) return 'Bem-vindo(a)!';
        const nome = usuario.nome.split(' ')[0];
        const hora = new Date().getHours();
        let saudacao = 'Bom dia';
        if (hora >= 12 && hora < 18) saudacao = 'Boa tarde';
        if (hora >= 18 || hora < 5) saudacao = 'Boa noite';
        return `${saudacao}, ${nome}!`;
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!usuario) {
        return <div className="loading-container">Não foi possível carregar os dados. Faça o login novamente.</div>;
    }

    const proximasTarefas = ((usuario.detalhesCirurgia?.fezCirurgia === 'sim' ? checklist.posOp : checklist.preOp) || []).filter(t => !t.concluido).slice(0, 3);
    const proximasConsultas = consultas.filter(c => new Date(c.data) >= new Date()).slice(0, 2);
    const mostrarCardAdicionarData = usuario.detalhesCirurgia?.fezCirurgia === 'nao' && !usuario.detalhesCirurgia.dataCirurgia;

    return (
        <div className="dashboard-page">
            <h1 className="dashboard-welcome">{getWelcomeMessage()}</h1>
            <div className="dashboard-grid">
                {mostrarCardAdicionarData && (
                    <div className="dashboard-card special-action-card">
                        <h3>Jornada a Começar!</h3>
                        <p>Já tem a data da sua cirurgia? Registre-a para começar a contagem regressiva!</p>
                        <button className="quick-action-btn" onClick={() => setIsDateModalOpen(true)}>Adicionar Data da Cirurgia</button>
                    </div>
                )}
                <div className="dashboard-card-wrapper">
                    <WeightProgressCard pesoInicial={usuario.detalhesCirurgia.pesoInicial} pesoAtual={usuario.detalhesCirurgia.pesoAtual} historico={pesos} />
                </div>
                <div className="dashboard-card-wrapper">
                    {dailyLog && <DailyGoalsCard log={dailyLog} onTrack={handleTrack} />}
                </div>
                <div className="dashboard-card-wrapper">
                    {medicationData?.medicamentos?.length > 0 && (
                        <DailyMedicationCard medicamentos={medicationData.medicamentos} historico={medicationData.historico || {}} onToggleToma={handleToggleMedToma} />
                    )}
                </div>
                <div className="dashboard-card-wrapper">
                    <div className="dashboard-card quick-actions-card">
                        <h3>Ações Rápidas</h3>
                        <Link to="/progresso" className="quick-action-btn">Ver Progresso Completo</Link>
                        <Link to="/consultas" className="quick-action-btn">Agendar Consulta</Link>
                        <Link to="/checklist" className="quick-action-btn">Ver Checklist Completo</Link>
                    </div>
                </div>
                <div className="dashboard-card-wrapper">
                    <div className="dashboard-card summary-card">
                        <h3>Próximas Tarefas</h3>
                        {proximasTarefas.length > 0 ? (
                            <ul className="summary-list">{proximasTarefas.map(task => <li key={task._id}>{task.descricao}</li>)}</ul>
                        ) : (
                            <div className="summary-empty"><p>Nenhuma tarefa pendente! ✨</p><Link to="/checklist" className="summary-action-btn">Adicionar Tarefa</Link></div>
                        )}
                    </div>
                </div>
                <div className="dashboard-card-wrapper">
                    <div className="dashboard-card summary-card">
                        <h3>Próximas Consultas</h3>
                        {proximasConsultas.length > 0 ? (
                            <ul className="summary-list">{proximasConsultas.map(consulta => (<li key={consulta._id}><strong>{consulta.especialidade}</strong> - {format(new Date(consulta.data), "dd/MM/yyyy 'às' p", { locale: ptBR })}</li>))}</ul>
                        ) : (
                            <div className="summary-empty"><p>Nenhuma consulta agendada.</p><Link to="/consultas" className="summary-action-btn">Agendar Consulta</Link></div>
                        )}
                    </div>
                </div>
            </div>
            <Modal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)}>
                <h2>Registrar Data da Cirurgia</h2>
                <form onSubmit={handleSetSurgeryDate}>
                    <label>Qual é a data agendada para a sua cirurgia?</label>
                    <input type="date" className="date-input" value={novaDataCirurgia} onChange={e => setNovaDataCirurgia(e.target.value)} required />
                    <button type="submit" className="submit-btn">Salvar Data</button>
                </form>
            </Modal>
        </div>
    );
};
export default DashboardPage;