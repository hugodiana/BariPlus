import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import DailyMedicationCard from '../components/dashboard/DailyMedicationCard';
import Modal from '../components/Modal';
import './DashboardPage.css';
import { format, differenceInDays } from 'date-fns';
import { format } from 'date-fns';

const DashboardPage = () => {
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
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchData = async () => {
            if (!token) { setLoading(false); return; }
            try {
                const [resMe, resDailyLog, resChecklist, resConsultas, resMedication, resPesos] = await Promise.all([
                    fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/dailylog/today`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/checklist`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/consultas`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/medication`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/pesos`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!resMe.ok) throw new Error('Sessão inválida');

                const dadosUsuario = await resMe.json();
                const dadosLog = await resDailyLog.json();
                const dadosChecklist = await resChecklist.json();
                const dadosConsultas = await resConsultas.json();
                const dadosMedication = await resMedication.json();
                const dadosPesos = await resPesos.json();

                setUsuario(dadosUsuario);
                setDailyLog(dadosLog);
                setChecklist(dadosChecklist);
                setConsultas(dadosConsultas.sort((a, b) => new Date(a.data) - new Date(b.data)));
                setMedicationData(dadosMedication);
                setPesos(dadosPesos.sort((a, b) => new Date(a.data) - new Date(b.data)));

            } catch (error) {
                console.error("Erro ao buscar dados do painel:", error);
                localStorage.removeItem('bariplus_token');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, apiUrl]);

    const handleTrack = async (type, amount) => { /* ... (código existente) */ };
    const handleSetSurgeryDate = async (e) => { /* ... (código existente) */ };
    const handleToggleMedToma = async (medId, totalDoses) => { /* ... (código existente) */ };
    const getWelcomeMessage = () => { /* ... (código existente) */ };

    if (loading || !usuario) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando seu painel...</div>;
    }

    const tarefasAtivas = (usuario.detalhesCirurgia?.fezCirurgia === 'sim' ? checklist.posOp : checklist.preOp) || [];
    const proximasTarefas = tarefasAtivas.filter(t => !t.concluido).slice(0, 3);
    const proximasConsultas = consultas.filter(c => new Date(c.data) >= new Date()).slice(0, 2);
    const mostrarCardAdicionarData = usuario.detalhesCirurgia?.fezCirurgia === 'nao' && !usuario.detalhesCirurgia.dataCirurgia;

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-welcome">{getWelcomeMessage()}</h1>
            <div className="dashboard-grid">
                {mostrarCardAdicionarData && (
                    <div className="dashboard-card special-action-card">
                        <h3>Jornada a Começar!</h3>
                        <p>Já tem a data da sua cirurgia? Registre-a para começar a contagem regressiva!</p>
                        <button className="quick-action-btn" onClick={() => setIsDateModalOpen(true)}>Adicionar Data da Cirurgia</button>
                    </div>
                )}
                
                <WeightProgressCard 
                    pesoInicial={usuario.detalhesCirurgia.pesoInicial}
                    pesoAtual={usuario.detalhesCirurgia.pesoAtual}
                    historico={pesos}
                />
                
                {dailyLog && <DailyGoalsCard log={dailyLog} onTrack={handleTrack} />}
                
                {medicationData?.medicamentos?.length > 0 && (
                    <DailyMedicationCard 
                        medicamentos={medicationData.medicamentos}
                        historico={medicationData.historico || {}}
                        onToggleToma={handleToggleMedToma}
                    />
                )}

                <div className="dashboard-card quick-actions-card">
                    <h3>Ações Rápidas</h3>
                    {/* ✅ CORREÇÃO: Botão substituído por um link */}
                    <Link to="/progresso" className="quick-action-btn">Ver Progresso Completo</Link>
                    <Link to="/consultas" className="quick-action-btn">Agendar Consulta</Link>
                    <Link to="/checklist" className="quick-action-btn">Ver Checklist Completo</Link>
                </div>

                <div className="dashboard-card summary-card">
                    <h3>Próximas Tarefas</h3>
                    {proximasTarefas.length > 0 ? (
                        <ul className="summary-list">{proximasTarefas.map(task => <li key={task._id}>{task.descricao}</li>)}</ul>
                    ) : (
                        <div className="summary-empty"><p>Nenhuma tarefa pendente! ✨</p><Link to="/checklist" className="summary-action-btn">Adicionar Tarefa</Link></div>
                    )}
                </div>

                <div className="dashboard-card summary-card">
                    <h3>Próximas Consultas</h3>
                    {proximasConsultas.length > 0 ? (
                        <ul className="summary-list">{proximasConsultas.map(consulta => (<li key={consulta._id}><strong>{consulta.especialidade}</strong> - {format(new Date(consulta.data), "dd/MM/yyyy 'às' p", { locale: ptBR })}</li>))}</ul>
                    ) : (
                        <div className="summary-empty"><p>Nenhuma consulta agendada.</p><Link to="/consultas" className="summary-action-btn">Agendar Consulta</Link></div>
                    )}
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