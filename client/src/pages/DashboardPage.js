import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays, parseISO, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { fetchApi } from '../utils/api';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import DailyMedicationCard from '../components/dashboard/DailyMedicationCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/ui/Card';
import ConteudoRecenteCard from '../components/dashboard/ConteudoRecenteCard';
import './DashboardPage.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const calcularPeriodo = (dataInicio, dataFim) => {
    let anos = dataFim.getFullYear() - dataInicio.getFullYear();
    let meses = dataFim.getMonth() - dataInicio.getMonth();
    let dias = dataFim.getDate() - dataInicio.getDate();

    if (dias < 0) {
        meses--;
        dias += new Date(dataFim.getFullYear(), dataFim.getMonth(), 0).getDate();
    }
    if (meses < 0) {
        anos--;
        meses += 12;
    }
    
    const parts = [];
    if (anos > 0) parts.push(`${anos} ${anos > 1 ? 'anos' : 'ano'}`);
    if (meses > 0) parts.push(`${meses} ${meses > 1 ? 'meses' : 'mês'}`);
    if (dias > 0 || parts.length === 0) parts.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`);
    
    return parts.join(', ');
};

const DashboardPage = () => {
    const [usuario, setUsuario] = useState(null);
    const [pesos, setPesos] = useState([]);
    const [dailyLog, setDailyLog] = useState(null);
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [consultas, setConsultas] = useState([]);
    const [medicationData, setMedicationData] = useState({ medicamentos: [], historico: {} });
    const [foodLog, setFoodLog] = useState(null);
    const [gastos, setGastos] = useState([]);
    const [exames, setExames] = useState({ examEntries: [] });
    const [conteudos, setConteudos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [novaDataCirurgia, setNovaDataCirurgia] = useState('');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const year = new Date().getFullYear();
            const month = new Date().getMonth() + 1;
            
            const endpoints = [
                '/api/me', `/api/food-diary/${today}`, '/api/checklist', '/api/consultas',
                '/api/medication', '/api/pesos', '/api/dailylog/today',
                `/api/gastos?year=${year}&month=${month}`, '/api/exams', '/api/conteudos'
            ];

            const responses = await Promise.all(endpoints.map(endpoint => fetchApi(endpoint)));
            for (const res of responses) {
                if (!res.ok) throw new Error('Falha ao carregar os dados do painel.');
            }

            const [
                dadosUsuario, dadosFoodLog, dadosChecklist, dadosConsultas, dadosMedication,
                dadosPesos, dadosLog, dadosGastos, dadosExames, dadosConteudos
            ] = await Promise.all(responses.map(res => res.json()));

            setUsuario(dadosUsuario);
            setFoodLog(dadosFoodLog);
            setChecklist(dadosChecklist);
            setConsultas(dadosConsultas.sort((a, b) => new Date(a.data) - new Date(b.data)));
            setMedicationData(dadosMedication);
            setPesos(dadosPesos.sort((a, b) => new Date(a.data) - new Date(b.data)));
            setDailyLog(dadosLog);
            setExames(dadosExames);
            setConteudos(dadosConteudos);
            setGastos(Array.isArray(dadosGastos) ? dadosGastos : dadosGastos?.registros || []);

        } catch (error) {
            if (!error.message.includes('Sessão expirada')) {
                toast.error(error.message || 'Erro ao carregar dados.');
            }
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleTrack = async (type, amount) => {
        try {
            const response = await fetchApi('/api/dailylog/track', {
                method: 'POST',
                body: JSON.stringify({ type, amount })
            });
            if (!response.ok) throw new Error('Falha ao registrar');
            
            const data = await response.json();
            setDailyLog(data.updatedLog);
            toast.success('Registro atualizado!');

            if (data.novasConquistas?.length > 0) {
                data.novasConquistas.forEach((conquista, index) => {
                    setTimeout(() => {
                        toast.info(<div><strong>🏆 Nova Conquista!</strong><br />{conquista.nome}</div>, { autoClose: 5000 });
                    }, index * 500);
                });
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSetSurgeryDate = async (e) => {
        e.preventDefault();
        if (!novaDataCirurgia) return toast.warning('Por favor, selecione uma data válida');

        try {
            const response = await fetchApi('/api/user/surgery-date', {
                method: 'PUT',
                body: JSON.stringify({ dataCirurgia: novaDataCirurgia })
            });
            if (!response.ok) throw new Error('Falha ao atualizar data');
            
            const updatedUser = await response.json();
            setUsuario(updatedUser);
            setIsDateModalOpen(false);
            setNovaDataCirurgia('');
            toast.success('Data da cirurgia atualizada com sucesso!');
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleToggleMedToma = async (medId, totalDoses) => {
        const hoje = new Date().toISOString().split('T')[0];
        const historicoDeHoje = medicationData.historico?.[hoje] || {};
        const tomasAtuais = historicoDeHoje[medId] || 0;
        const novasTomas = (tomasAtuais + 1) > totalDoses ? 0 : tomasAtuais + 1;

        const originalState = { ...medicationData };
        setMedicationData(prev => {
            const newHistory = { ...prev.historico };
            newHistory[hoje] = { ...newHistory[hoje], [medId]: novasTomas };
            return { ...prev, historico: newHistory };
        });

        try {
            await fetchApi('/api/medication/log', {
                method: 'POST',
                body: JSON.stringify({ date: hoje, medId: medId, count: novasTomas })
            });
        } catch (error) {
            toast.error('Erro ao atualizar medicação. A reverter.');
            setMedicationData(originalState);
        }
    };

    const handleUserUpdate = (updatedUser) => {
        setUsuario(updatedUser);
    };

    const getWelcomeMessage = () => {
        if (!usuario?.nome) return 'Bem-vindo(a)!';
        const nome = usuario.nome.split(' ')[0];
        const hora = new Date().getHours();
        if (hora >= 12 && hora < 18) return `Boa tarde, ${nome}!`;
        if (hora >= 18 || hora < 5) return `Boa noite, ${nome}!`;
        return `Bom dia, ${nome}!`;
    };

    const focoDoDia = useMemo(() => {
        if (!consultas || !usuario) return null;
        
        const consultaDeHoje = consultas.find(c => c.status === 'Agendado' && isToday(parseISO(c.data)));
        if (consultaDeHoje) {
            return {
                tipo: 'consulta', icone: '🗓️', titulo: 'Consulta Hoje!',
                descricao: `Você tem uma consulta com ${consultaDeHoje.especialidade} às ${format(parseISO(consultaDeHoje.data), 'HH:mm')}.`,
                link: '/consultas'
            };
        }

        if (usuario.detalhesCirurgia?.fezCirurgia === 'nao' && !usuario.detalhesCirurgia.dataCirurgia) {
            return {
                tipo: 'acao', icone: '📅', titulo: 'Jornada a Começar!',
                descricao: 'Já tem a data da sua cirurgia? Registe-a para começar a contagem regressiva!',
                acao: () => setIsDateModalOpen(true)
            };
        }
        
        if (dailyLog && dailyLog.waterConsumed < (usuario.detalhesCirurgia?.metaAguaDiaria || 2000)) {
             return {
                tipo: 'meta', icone: '💧', titulo: 'Mantenha-se Hidratado',
                descricao: 'Continue a registar o seu consumo de água para atingir a sua meta diária.',
                link: '/#metas-diarias'
            };
        }
        
        return null;
    }, [consultas, usuario, dailyLog]);

    if (loading || !usuario) return <LoadingSpinner fullPage />;

    const proximasTarefas = ((usuario.detalhesCirurgia?.fezCirurgia === 'sim' ? checklist.posOp : checklist.preOp) || [])
        .filter(t => !t.concluido).slice(0, 3);
        
    const proximasConsultas = consultas
        .filter(c => new Date(c.data) >= new Date()).slice(0, 2);

    return (
        <div className="page-container dashboard-container">
            <header className="page-header">
                <h1 className="dashboard-welcome">{getWelcomeMessage()}</h1>
            </header>

            {focoDoDia && (
                <Card className={`foco-do-dia-card foco-${focoDoDia.tipo}`}>
                    <span className="foco-icone">{focoDoDia.icone}</span>
                    <div className="foco-info">
                        <h3>{focoDoDia.titulo}</h3>
                        <p>{focoDoDia.descricao}</p>
                    </div>
                    {focoDoDia.link ? (
                        <Link to={focoDoDia.link} className="foco-action">Ver Detalhes</Link>
                    ) : (
                        <button onClick={focoDoDia.acao} className="foco-action">Adicionar Data</button>
                    )}
                </Card>
            )}

            <div className="dashboard-main-grid">
                <div className="dashboard-coluna-principal">
                    {dailyLog && <DailyGoalsCard log={dailyLog} onTrack={handleTrack} usuario={usuario} onUserUpdate={handleUserUpdate} />}
                    {medicationData?.medicamentos?.length > 0 && <DailyMedicationCard medicamentos={medicationData.medicamentos} historico={medicationData.historico || {}} onToggleToma={handleToggleMedToma} />}
                    <WeightProgressCard usuario={usuario} />
                </div>
                <div className="dashboard-coluna-secundaria">
                    <Card className="dashboard-card summary-card">
                        {/* ✅ Ícone adicionado */}
                        <h3><span className="card-icon">📌</span> Próximas Tarefas</h3>
                        {proximasTarefas.length > 0 ? (
                            <ul className="summary-list">
                                {proximasTarefas.map(task => <li key={task._id}>{task.descricao}</li>)}
                            </ul>
                        ) : (
                            // ✅ Empty state melhorado
                            <div className="summary-empty">
                                <span className="empty-icon">🎉</span>
                                <p>Nenhuma tarefa pendente!</p>
                                <Link to="/checklist" className="summary-action-btn">Adicionar Tarefa</Link>
                            </div>
                        )}
                    </Card>
                    <Card className="dashboard-card summary-card">
                        {/* ✅ Ícone adicionado */}
                        <h3><span className="card-icon">🗓️</span> Próximas Consultas</h3>
                        {proximasConsultas.length > 0 ? (
                            <ul className="summary-list">
                                {proximasConsultas.map(c => (
                                    <li key={c._id}>
                                        <strong>{c.especialidade}</strong> - {format(parseISO(c.data), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            // ✅ Empty state melhorado
                            <div className="summary-empty">
                                <span className="empty-icon">🗓️</span>
                                <p>Nenhuma consulta agendada.</p>
                                <Link to="/consultas" className="summary-action-btn">Agendar Consulta</Link>
                            </div>
                        )}
                    </Card>
                    {conteudos && conteudos.length > 0 && <ConteudoRecenteCard conteudos={conteudos} />}
                </div>
            </div>

            <Modal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)}>
                <h2>Registrar Data da Cirurgia</h2>
                <form onSubmit={handleSetSurgeryDate} className="date-form">
                    <div className="form-group">
                        <label htmlFor="surgery-date">Data Agendada:</label>
                        <input id="surgery-date" type="date" value={novaDataCirurgia} onChange={e => setNovaDataCirurgia(e.target.value)} required min={format(new Date(), 'yyyy-MM-dd')} />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsDateModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="primary-btn">Salvar Data</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
export default DashboardPage;