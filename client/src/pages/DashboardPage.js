import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import DailyMedicationCard from '../components/dashboard/DailyMedicationCard';
import Modal from '../components/Modal';
import './DashboardPage.css';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardPage = () => {
    const [usuario, setUsuario] = useState(null);
    const [pesos, setPesos] = useState([]);
    const [dailyLog, setDailyLog] = useState(null);
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [consultas, setConsultas] = useState([]);
    const [medicationData, setMedicationData] = useState({ medicamentos: [], historico: {} });
    const [loading, setLoading] = useState(true);
    const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [novoPeso, setNovoPeso] = useState('');
    const [novaDataCirurgia, setNovaDataCirurgia] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchData = async () => {
            if (!token) { setLoading(false); return; }
            try {
                // ✅ CORREÇÃO: Nome da variável corrigido para resPesos
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
                const dadosPesos = await resPesos.json(); // ✅ CORREÇÃO: Processamento dos dados movido para aqui

                // Atualiza todos os estados
                setUsuario(dadosUsuario);
                setDailyLog(dadosLog);
                setChecklist(dadosChecklist);
                setConsultas(dadosConsultas.sort((a, b) => new Date(a.data) - new Date(b.data)));
                setMedicationData(dadosMedication);
                setPesos(dadosPesos.sort((a, b) => new Date(a.data) - new Date(b.data))); // ✅ CORREÇÃO

            } catch (error) {
                console.error("Erro ao buscar dados do painel:", error);
                localStorage.removeItem('bariplus_token');
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
            const res = await fetch(`${apiUrl}/api/pesos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // FormData não precisa de Content-Type
                body: new FormData(e.target) // Simplificado para enviar o formulário inteiro
            });
            const novoRegistro = await res.json();
            setPesos(prev => [...prev, novoRegistro].sort((a, b) => new Date(a.data) - new Date(b.data)));
            setUsuario(prev => ({ ...prev, detalhesCirurgia: { ...prev.detalhesCirurgia, pesoAtual: parseFloat(novoPeso) } }));
            setNovoPeso('');
            setIsWeightModalOpen(false);
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
            setDailyLog(updatedLog);
        } catch (error) { console.error(`Erro ao registrar ${type}:`, error); }
    };
    
    const handleSetSurgeryDate = async (e) => {
        e.preventDefault();
        if (!novaDataCirurgia) return;
        try {
            const res = await fetch(`${apiUrl}/api/user/surgery-date`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ dataCirurgia: novaDataCirurgia })
            });
            if (!res.ok) throw new Error('Falha ao salvar a data');
            const usuarioAtualizado = await res.json();
            setUsuario(usuarioAtualizado);
            setNovaDataCirurgia('');
            setIsDateModalOpen(false);
        } catch (error) { console.error("Erro ao salvar data da cirurgia:", error); }
    };

    const handleToggleMedToma = async (medId, totalDoses) => {
        const hoje = new Date().toISOString().split('T')[0];
        const historicoDeHoje = (medicationData.historico && medicationData.historico[hoje]) || {};
        const tomasAtuais = historicoDeHoje[medId] || 0;
        const novasTomas = (tomasAtuais + 1) > totalDoses ? 0 : tomasAtuais + 1;

        const newHistoryState = { ...medicationData.historico };
        if (!newHistoryState[hoje]) {
            newHistoryState[hoje] = {};
        }
        newHistoryState[hoje][medId] = novasTomas;
        setMedicationData({ ...medicationData, historico: newHistoryState });
        
        await fetch(`${apiUrl}/api/medication/log/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ date: hoje, medId: medId, count: novasTomas })
        });
    };

    const getWelcomeMessage = () => {
        if (!usuario || !usuario.detalhesCirurgia) return `Bem-vindo(a) de volta, ${usuario?.nome || ''}!`;
        const { fezCirurgia, dataCirurgia } = usuario.detalhesCirurgia;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); 
        if (fezCirurgia === 'sim' && dataCirurgia) {
            const diasDePosOp = differenceInDays(hoje, new Date(dataCirurgia));
            if (diasDePosOp >= 0) return `Olá, ${usuario.nome}! Você está no seu ${diasDePosOp + 1}º dia de pós-operatório.`;
        } else if (fezCirurgia === 'nao' && dataCirurgia) {
            const diasParaCirurgia = differenceInDays(new Date(dataCirurgia), hoje);
            if (diasParaCirurgia >= 0) return `Olá, ${usuario.nome}! Faltam ${diasParaCirurgia} dias para a sua cirurgia.`;
        }
        return `Bem-vindo(a) de volta, ${usuario.nome}!`;
    };

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
                {/* ✅ CORREÇÃO: Passa o estado 'pesos' como 'historico' */}
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
                    <button className="quick-action-btn" onClick={() => setIsWeightModalOpen(true)}>Registrar Novo Peso</button>
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

            <Modal isOpen={isWeightModalOpen} onClose={() => setIsWeightModalOpen(false)}>
                <h2>Registrar Novo Peso</h2>
                <form onSubmit={handleRegistrarPeso}>
                    <input type="number" step="0.1" className="weight-input" placeholder="Ex: 97.5" value={novoPeso} onChange={e => setNovoPeso(e.target.value)} required />
                    <button type="submit" className="submit-btn">Salvar</button>
                </form>
            </Modal>

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