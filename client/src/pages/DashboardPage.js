import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import Modal from '../components/Modal';
import './DashboardPage.css';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardPage = () => {
    // A lógica de estados continua a mesma
    const [usuario, setUsuario] = useState(null);
    const [dailyLog, setDailyLog] = useState(null);
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoPeso, setNovoPeso] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    // A lógica de busca de dados continua a mesma
    useEffect(() => {
        const fetchData = async () => {
            if (!token) { setLoading(false); return; }
            try {
                const [resMe, resDailyLog, resChecklist, resConsultas] = await Promise.all([
                    fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/dailylog/today`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/checklist`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/consultas`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                if (!resMe.ok) throw new Error('Sessão inválida');
                const dadosUsuario = await resMe.json();
                const dadosLog = await resDailyLog.json();
                const dadosChecklist = await resChecklist.json();
                const dadosConsultas = await resConsultas.json();
                setUsuario(dadosUsuario);
                setDailyLog(dadosLog);
                setChecklist(dadosChecklist);
                setConsultas(dadosConsultas.sort((a, b) => new Date(a.data) - new Date(b.data)));
            } catch (error) {
                console.error("Erro ao buscar dados do painel:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, apiUrl]);

    // A lógica das funções handle... continua a mesma
    const handleRegistrarPeso = async (e) => { /* ...código existente... */ };
    const handleTrack = async (type, amount) => { /* ...código existente... */ };

    // --- NOVIDADE: FUNÇÃO PARA GERAR A MENSAGEM INTELIGENTE ---
    const getWelcomeMessage = () => {
        if (!usuario || !usuario.detalhesCirurgia) return `Bem-vindo(a) de volta, ${usuario.nome}!`;

        const { fezCirurgia, dataCirurgia } = usuario.detalhesCirurgia;
        const hoje = new Date();

        if (fezCirurgia === 'sim') {
            const dataDaCirurgia = new Date(dataCirurgia);
            const diasDePosOp = differenceInDays(hoje, dataDaCirurgia);
            if (diasDePosOp >= 0) {
                return `Olá, ${usuario.nome}! Você está no seu ${diasDePosOp + 1}º dia de pós-operatório.`;
            }
        } else if (fezCirurgia === 'nao' && dataCirurgia) {
            const dataDaCirurgia = new Date(dataCirurgia);
            const diasParaCirurgia = differenceInDays(dataDaCirurgia, hoje);
            if (diasParaCirurgia >= 0) {
                return `Olá, ${usuario.nome}! Faltam ${diasParaCirurgia} dias para a sua cirurgia.`;
            }
        }
        return `Bem-vindo(a) de volta, ${usuario.nome}!`;
    };
    // --- FIM DA NOVIDADE ---

    if (loading || !usuario) return <div style={{ padding: '40px', textAlign: 'center' }}>A carregar o seu painel...</div>;

    const tarefasAtivas = (usuario.detalhesCirurgia?.fezCirurgia === 'sim' ? checklist.posOp : checklist.preOp) || [];
    const proximasTarefas = tarefasAtivas.filter(t => !t.concluido).slice(0, 3);
    const proximasConsultas = consultas.filter(c => new Date(c.data) >= new Date()).slice(0, 2);

    return (
        <div className="dashboard-container">
            {/* NOVIDADE: Usando a nova função para a mensagem de boas-vindas */}
            <h1 className="dashboard-welcome">{getWelcomeMessage()}</h1>
            
            <div className="dashboard-grid">
                <WeightProgressCard 
                    pesoInicial={usuario.detalhesCirurgia.pesoInicial}
                    pesoAtual={usuario.detalhesCirurgia.pesoAtual}
                />
                
                {dailyLog && <DailyGoalsCard log={dailyLog} onTrack={handleTrack} />}

                <div className="dashboard-card summary-card">
                    <h3>Próximas Tarefas</h3>
                    {proximasTarefas.length > 0 ? (
                        <ul className="summary-list">
                            {proximasTarefas.map(task => <li key={task._id}>{task.descricao}</li>)}
                        </ul>
                    ) : (
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
                        <div className="summary-empty">
                            <p>Nenhuma consulta agendada.</p>
                            <Link to="/consultas" className="summary-action-btn">Agendar Consulta</Link>
                        </div>
                    )}
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