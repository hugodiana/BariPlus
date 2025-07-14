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
        const fetchData = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                // Busca todos os dados necessários para o painel em paralelo
                const [resMe, resDailyLog, resChecklist, resConsultas] = await Promise.all([
                    fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/dailylog/today`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/checklist`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/consultas`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!resMe.ok) throw new Error('Sessão inválida, por favor faça o login novamente.');

                // Processa todas as respostas
                const dadosUsuario = await resMe.json();
                const dadosLog = await resDailyLog.json();
                const dadosChecklist = await resChecklist.json();
                const dadosConsultas = await resConsultas.json();

                // Atualiza o estado com todos os dados de uma vez
                setUsuario(dadosUsuario);
                setDailyLog(dadosLog);
                setChecklist(dadosChecklist);
                setConsultas(dadosConsultas.sort((a, b) => new Date(a.data) - new Date(b.data)));

            } catch (error) {
                console.error("Erro ao buscar dados do painel:", error);
                localStorage.removeItem('bariplus_token');
                //window.location.href = '/login'; // Descomente se quiser redirecionar em caso de erro
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
            // Atualiza o estado local para refletir a mudança instantaneamente
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
            setDailyLog(updatedLog);
        } catch (error) {
            console.error(`Erro ao registar ${type}:`, error);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>A carregar o seu painel...</div>;
    if (!usuario) return <div style={{ padding: '40px', textAlign: 'center' }}>Não foi possível carregar os dados. Por favor, tente fazer o login novamente.</div>;

    // Lógica para filtrar e mostrar os dados nos cards
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