import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import Modal from '../components/Modal';
import './DashboardPage.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardPage = () => {
    const [usuario, setUsuario] = useState(null);
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoPeso, setNovoPeso] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL; // Definimos o "apelido" uma vez

    useEffect(() => {
        const fetchData = async () => {
            try {
                // AQUI ESTÁ A MUDANÇA
                const [resMe, resChecklist, resConsultas] = await Promise.all([
                    fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/checklist`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/consultas`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                // ... (resto do useEffect não muda)
                if (!resMe.ok) throw new Error('Sessão inválida');
                const dadosUsuario = await resMe.json();
                const dadosChecklist = await resChecklist.json();
                const dadosConsultas = await resConsultas.json();
                setUsuario(dadosUsuario);
                setChecklist(dadosChecklist);
                setConsultas(dadosConsultas.sort((a, b) => new Date(a.data) - new Date(b.data)));
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
            // AQUI ESTÁ A MUDANÇA
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

    if (loading) return <div>Carregando painel...</div>;
    if (!usuario) return null;

    const tarefasAtivas = (usuario.detalhesCirurgia?.fezCirurgia === 'sim' ? checklist.posOp : checklist.preOp) || [];
    const proximasTarefas = tarefasAtivas.filter(t => !t.concluido).slice(0, 3);
    const proximasConsultas = consultas.filter(c => new Date(c.data) >= new Date()).slice(0, 2);

    // O return (JSX) não muda
    return (
        <div className="dashboard-container">
            <h1 className="dashboard-welcome">Bem-vindo(a) de volta, {usuario.nome}!</h1>
            <div className="dashboard-grid">
                <WeightProgressCard 
                    pesoInicial={usuario.detalhesCirurgia.pesoInicial}
                    pesoAtual={usuario.detalhesCirurgia.pesoAtual}
                />
                <div className="dashboard-card quick-actions-card">
                    <h3>Ações Rápidas</h3>
                    <button className="quick-action-btn" onClick={() => setIsModalOpen(true)}>
                        Registrar Novo Peso
                    </button>
                    <Link to="/consultas" className="quick-action-btn">
                        Agendar Consulta
                    </Link>
                    <Link to="/checklist" className="quick-action-btn">
                        Ver Checklist Completo
                    </Link>
                </div>
                <div className="dashboard-card summary-card">
                    <h3>Próximas Tarefas</h3>
                    {proximasTarefas.length > 0 ? (
                        <ul className="summary-list">
                            {proximasTarefas.map(task => <li key={task.id}>{task.descricao}</li>)}
                        </ul>
                    ) : <p className="summary-empty">Nenhuma tarefa pendente!</p>}
                </div>
                <div className="dashboard-card summary-card">
                    <h3>Próximas Consultas</h3>
                    {proximasConsultas.length > 0 ? (
                        <ul className="summary-list">
                            {proximasConsultas.map(consulta => (
                                <li key={consulta.id}>
                                    <strong>{consulta.especialidade}</strong> - {format(new Date(consulta.data), 'dd/MM/yyyy \'às\' HH:mm')}h
                                </li>
                            ))}
                        </ul>
                    ) : <p className="summary-empty">Nenhuma consulta agendada.</p>}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Registrar Novo Peso</h2>
                <form onSubmit={handleRegistrarPeso}>
                    <input type="number" step="0.1" className="weight-input" placeholder="Ex: 97.5" value={novoPeso} onChange={e => setNovoPeso(e.target.value)} required />
                    <button type="submit" className="submit-btn">Salvar</button>
                </form>
            </Modal>
        </div>
    );
};

export default DashboardPage;