import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { fetchWithAuth } from '../utils/api';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import DailyMedicationCard from '../components/dashboard/DailyMedicationCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import './DashboardPage.css';
import Card from '../components/ui/Card';
import ConteudoRecenteCard from '../components/dashboard/ConteudoRecenteCard';


ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

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

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
        const today = new Date().toISOString().split('T')[0];
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        
        // Lista de todas as rotas necessárias para o dashboard
        const endpoints = [
            '/api/me',
            `/api/food-diary/${today}`,
            '/api/checklist',
            '/api/consultas',
            '/api/medication',
            '/api/pesos',
            '/api/dailylog/today',
            `/api/gastos?year=${year}&month=${month}`,
            '/api/exams',
            '/api/conteudos'
        ];

        // Usamos a função fetchApi centralizada que criámos
        const responses = await Promise.all(
            endpoints.map(endpoint => fetchApi(endpoint))
        );

        for (const res of responses) {
            if (!res.ok) {
                // O fetchApi já trata o erro 401, mas isto serve para outros erros
                throw new Error('Falha ao carregar os dados do painel.');
            }
        }

        const [
            dadosUsuario,
            dadosFoodLog,
            dadosChecklist,
            dadosConsultas,
            dadosMedication,
            dadosPesos,
            dadosLog,
            dadosGastos,
            dadosExames,
            dadosConteudos
        ] = await Promise.all(responses.map(res => res.json()));

        // Atualiza todos os estados com os dados recebidos
        setUsuario(dadosUsuario);
        setFoodLog(dadosFoodLog);
        setChecklist(dadosChecklist);
        setConsultas(dadosConsultas.sort((a, b) => new Date(a.data) - new Date(b.data)));
        setMedicationData(dadosMedication);
        setPesos(dadosPesos.sort((a, b) => new Date(a.data) - new Date(b.data)));
        setDailyLog(dadosLog);
        setExames(dadosExames);
        setConteudos(dadosConteudos);
        
        const gastosFormatados = Array.isArray(dadosGastos) 
            ? dadosGastos 
            : dadosGastos?.registros || [];
        setGastos(gastosFormatados);

    } catch (error) {
        // O erro de sessão expirada já é tratado pelo fetchApi
        if (!error.message.includes('Sessão expirada')) {
            toast.error(error.message || 'Erro ao carregar dados.');
        }
    } finally {
        setLoading(false);
    }
}, []); // A dependência do useCallback está vazia porque fetchApi é estável

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
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao registrar');
            }

            const data = await response.json();
            setDailyLog(data.updatedLog);
            toast.success('Registro atualizado!');

            if (data.novasConquistas?.length > 0) {
                data.novasConquistas.forEach((conquista, index) => {
                    setTimeout(() => {
                        toast.info(
                            <div>
                                <strong>🏆 Nova Conquista!</strong><br />
                                {conquista.nome}
                            </div>,
                            { autoClose: 5000 }
                        );
                    }, index * 500);
                });
            }
        } catch (error) {
            console.error('Erro ao registrar:', error);
            toast.error(error.message);
        }
    };

    const handleSetSurgeryDate = async (e) => {
        e.preventDefault();
        if (!novaDataCirurgia) {
            toast.warning('Por favor, selecione uma data válida');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/user/surgery-date`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ dataCirurgia: novaDataCirurgia })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao atualizar data');
            }

            const updatedUser = await response.json();
            setUsuario(updatedUser);
            setIsDateModalOpen(false);
            setNovaDataCirurgia('');
            toast.success('Data da cirurgia atualizada com sucesso!');
            fetchDashboardData(); // Recarrega os dados para atualizar a interface
        } catch (error) {
            console.error('Erro ao atualizar data:', error);
            toast.error(error.message);
        }
    };
    
    const handleToggleMedToma = async (medId, totalDoses) => {
        try {
            const hoje = new Date().toISOString().split('T')[0];
            const historicoDeHoje = medicationData.historico?.[hoje] || {};
            const tomasAtuais = historicoDeHoje[medId] || 0;
            const novasTomas = (tomasAtuais + 1) > totalDoses ? 0 : tomasAtuais + 1;

            // Atualização otimista do estado
            setMedicationData(prev => {
                const newHistory = { ...prev.historico };
                newHistory[hoje] = { ...newHistory[hoje], [medId]: novasTomas };
                return { ...prev, historico: newHistory };
            });

            // Chamada API
            await fetch(`${apiUrl}/api/medication/log`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    date: hoje, 
                    medId: medId, 
                    count: novasTomas 
                })
            });

        } catch (error) {
            console.error('Erro ao atualizar medicação:', error);
            toast.error('Erro ao atualizar medicação. Tente novamente.');
            // Reverte a atualização otimista em caso de erro
            fetchDashboardData();
        }
    };

    const getWelcomeMessage = () => {
        if (!usuario?.nome) return 'Bem-vindo(a)!';
        
        const nome = usuario.nome.split(' ')[0];
        const hora = new Date().getHours();
        let saudacao = 'Bom dia';
        
        if (hora >= 12 && hora < 18) saudacao = 'Boa tarde';
        if (hora >= 18 || hora < 5) saudacao = 'Boa noite';

        if (!usuario.detalhesCirurgia?.dataCirurgia) {
            return `${saudacao}, ${nome}!`;
        }

        const { fezCirurgia, dataCirurgia } = usuario.detalhesCirurgia;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataCirurgiaObj = parseISO(dataCirurgia);

        if (fezCirurgia === 'sim') {
            const tempoDePosOp = calcularPeriodo(dataCirurgiaObj, hoje);
            return `Olá, ${nome}! Você está no pós-operatório há ${tempoDePosOp}.`;
        } else {
            const diasParaCirurgia = differenceInDays(dataCirurgiaObj, hoje);
            if (diasParaCirurgia > 0) {
                const tempoParaCirurgia = calcularPeriodo(hoje, dataCirurgiaObj);
                return `Olá, ${nome}! Faltam ${tempoParaCirurgia} para sua cirurgia.`;
            }
            if (diasParaCirurgia === 0) return `Olá, ${nome}! Sua cirurgia é hoje! Boa sorte!`;
        }
        
        return `${saudacao}, ${nome}!`;
    };

    // Memoized calculations
    const { pesoPerdido, imc } = useMemo(() => {
        if (!usuario?.detalhesCirurgia) return { pesoPerdido: 0, imc: 0 };
        
        const { pesoInicial, altura, pesoAtual } = usuario.detalhesCirurgia;
        const pesoPerdidoCalc = (pesoInicial || 0) - (pesoAtual || 0);
        const alturaMetros = (altura || 0) / 100;
        const imcCalc = alturaMetros > 0 ? (pesoAtual / (alturaMetros * alturaMetros)) : 0;
        
        return { 
            pesoPerdido: pesoPerdidoCalc, 
            imc: imcCalc 
        };
    }, [usuario]);

    const TOTAIS_NUTRICIONAIS = useMemo(() => {
        if (!foodLog?.refeicoes) return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
        
        return Object.values(foodLog.refeicoes).reduce((totals, meal) => {
            meal.forEach(item => {
                totals.calories += item.nutrients?.calories || 0;
                totals.proteins += item.nutrients?.proteins || 0;
                totals.carbs += item.nutrients?.carbs || 0;
                totals.fats += item.nutrients?.fats || 0;
            });
            return totals;
        }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });
    }, [foodLog]);

    const GASTO_MENSAL = useMemo(() => {
        const hoje = new Date();
        const inicioDoMes = startOfMonth(hoje);
        const fimDoMes = endOfMonth(hoje);
        
        return gastos
            .filter(gasto => {
                const dataGasto = parseISO(gasto.data);
                return dataGasto >= inicioDoMes && dataGasto <= fimDoMes;
            })
            .reduce((total, gasto) => total + (gasto.valor || 0), 0);
    }, [gastos]);

    const ULTIMOS_EXAMES = useMemo(() => {
        if (!exames.examEntries || exames.examEntries.length === 0) return [];
        
        return exames.examEntries
            .flatMap(entry => 
                entry.history?.map(h => ({
                    ...h,
                    nomeExame: entry.name,
                    unidade: entry.unit,
                })) || []
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);
    }, [exames]);

    const DADOS_GRAFICO_NUTRI = {
        labels: ['Proteínas (g)', 'Carboidratos (g)', 'Gorduras (g)'],
        datasets: [{
            data: [TOTAIS_NUTRICIONAIS.proteins, TOTAIS_NUTRICIONAIS.carbs, TOTAIS_NUTRICIONAIS.fats],
            backgroundColor: ['#37715b', '#007aff', '#ff9f40'],
            borderColor: '#ffffff',
            borderWidth: 2,
        }]
    };
    
    if (loading) return <LoadingSpinner fullPage />;
    if (!usuario) return (
        <div className="loading-container">
            <p>Não foi possível carregar seus dados.</p>
            <Link to="/login" className="retry-link">Tente fazer login novamente</Link>
        </div>
    );
    
    const proximasTarefas = ((usuario.detalhesCirurgia?.fezCirurgia === 'sim' ? checklist.posOp : checklist.preOp) || [])
        .filter(t => !t.concluido)
        .slice(0, 3);
        
    const proximasConsultas = consultas
        .filter(c => new Date(c.data) >= new Date())
        .slice(0, 2);
        
    const mostrarCardAdicionarData = usuario.detalhesCirurgia?.fezCirurgia === 'nao' && 
                                   !usuario.detalhesCirurgia.dataCirurgia;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="dashboard-welcome">{getWelcomeMessage()}</h1>
            </header>

            <div className="summary-stats-grid">
                <Card className="stat-item">
                    <h3>Peso Perdido</h3>
                    <p>{pesoPerdido.toFixed(1)} kg</p>
                </Card>
                <Card className="stat-item">
                    <h3>IMC Atual</h3>
                    <p>{imc.toFixed(1)}</p>
                </Card>
                <Card className="stat-item">
                    <h3>Calorias Hoje</h3>
                    <p>{TOTAIS_NUTRICIONAIS.calories.toFixed(0)}</p>
                </Card>
                <Card className="stat-item">
                    <h3>Gastos do Mês</h3>
                    <p>{GASTO_MENSAL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </Card>
                {conteudos && conteudos.length > 0 && (
                    <ConteudoRecenteCard conteudos={conteudos} />
                )}
            </div>

            <div className="dashboard-grid">
                
                {mostrarCardAdicionarData && (
                    <Card className="special-action-card">
                        <h3>Jornada a Começar!</h3>
                        <p>Já tem a data da sua cirurgia? Registre-a para começar a contagem regressiva!</p>
                        <button 
                            className="quick-action-btn" 
                            onClick={() => setIsDateModalOpen(true)}
                            aria-label="Adicionar data da cirurgia"
                        >
                            Adicionar Data
                        </button>
                    </Card>
                )}
                
                <Card className="dashboard-card nutrition-summary-card">
                    <h3>Resumo Nutricional de Hoje</h3>
                    <div className="nutrition-chart-container">
                        <Doughnut 
                            data={DADOS_GRAFICO_NUTRI} 
                            options={{ 
                                responsive: true, 
                                maintainAspectRatio: false, 
                                plugins: { 
                                    legend: { position: 'bottom' } 
                                } 
                            }} 
                        />
                    </div>
                    <Link to="/diario-alimentar" className="summary-action-btn">
                        Ver Diário Completo
                    </Link>
                </Card>
                
                <WeightProgressCard 
                    pesoInicial={usuario.detalhesCirurgia?.pesoInicial} 
                    pesoAtual={usuario.detalhesCirurgia?.pesoAtual} 
                    historico={pesos} 
                />
                
                {dailyLog && (
                    <DailyGoalsCard 
                        log={dailyLog} 
                        onTrack={handleTrack} 
                        usuario={usuario}
                    />
                )}
                
                {medicationData?.medicamentos?.length > 0 && (
                    <DailyMedicationCard 
                        medicamentos={medicationData.medicamentos} 
                        historico={medicationData.historico || {}} 
                        onToggleToma={handleToggleMedToma} 
                    />
                )}

                {conteudos && conteudos.length > 0 && (
                    <ConteudoRecenteCard conteudos={conteudos} />
                )}
                
                <Card className="dashboard-card quick-actions-card">
                    <h3>Ações Rápidas</h3>
                    <div className="quick-actions-grid">
                        <Link to="/progresso" className="quick-action-btn">
                            Ver Progresso
                        </Link>
                        <Link to="/consultas" className="quick-action-btn">
                            Agendar Consulta
                        </Link>
                        <Link to="/checklist" className="quick-action-btn">
                            Ver Checklist
                        </Link>
                        <Link to="/gastos" className="quick-action-btn">
                            Registrar Gastos
                        </Link>
                    </div>
                </Card>

                <Card className="dashboard-card summary-card">
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
                </Card>
                
                <Card className="dashboard-card summary-card">
                    <h3>Próximas Consultas</h3>
                    {proximasConsultas.length > 0 ? (
                        <ul className="summary-list">
                            {proximasConsultas.map(consulta => (
                                <li key={consulta._id}>
                                    <strong>{consulta.especialidade}</strong> - {format(
                                        parseISO(consulta.data), 
                                        "dd/MM/yyyy 'às' HH:mm", 
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
                </Card>

                <Card className="dashboard-card summary-card">
                    <h3>Últimos Exames</h3>
                    {ULTIMOS_EXAMES.length > 0 ? (
                        <ul className="summary-list">
                            {ULTIMOS_EXAMES.map((exame, index) => (
                                <li key={`${exame._id}-${index}`}>
                                    <strong>{exame.nomeExame}:</strong> {exame.value} {exame.unidade}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="summary-empty">
                            <p>Nenhum exame registrado.</p>
                            <Link to="/exames" className="summary-action-btn">
                                Adicionar Exame
                            </Link>
                        </div>
                    )}
                </Card>
            </div>
            
            <Modal 
                isOpen={isDateModalOpen} 
                onClose={() => setIsDateModalOpen(false)}
                aria-labelledby="surgery-date-modal-title"
            >
                <h2 id="surgery-date-modal-title">Registrar Data da Cirurgia</h2>
                <form onSubmit={handleSetSurgeryDate} className="date-form">
                    <div className="form-group">
                        <label htmlFor="surgery-date">Data Agendada:</label>
                        <input 
                            id="surgery-date"
                            type="date" 
                            value={novaDataCirurgia}
                            onChange={e => setNovaDataCirurgia(e.target.value)}
                            required
                            min={format(new Date(), 'yyyy-MM-dd')}
                        />
                    </div>
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="secondary-btn"
                            onClick={() => setIsDateModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="primary-btn">
                            Salvar Data
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DashboardPage;