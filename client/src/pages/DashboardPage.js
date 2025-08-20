// client/src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { fetchApi } from '../utils/api';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import DailyMedicationCard from '../components/dashboard/DailyMedicationCard';
import MetasCard from '../components/dashboard/MetasCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/ui/Card';
import ConteudoRecenteCard from '../components/dashboard/ConteudoRecenteCard';
import './DashboardPage.css';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';

ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardPage = () => {
    const [usuario, setUsuario] = useState(null);
    const [pesos, setPesos] = useState([]);
    const [dailyLog, setDailyLog] = useState(null);
    const [checklist, setChecklist] = useState({ preOp: [], posOp: [] });
    const [consultas, setConsultas] = useState([]);
    const [medicationData, setMedicationData] = useState({ medicamentos: [], logDoDia: { dosesTomadas: [] } });
    const [conteudos, setConteudos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [novaDataCirurgia, setNovaDataCirurgia] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [metas, setMetas] = useState([]);

    const handleEnableNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
                if (!vapidKey) return toast.error("Configuração de notificações em falta.");
                const fcmToken = await getToken(messaging, { vapidKey });
                if (fcmToken) {
                    await fetchApi('/api/user/save-fcm-token', {
                        method: 'POST',
                        body: JSON.stringify({ fcmToken })
                    });
                    toast.success("Notificações ativadas com sucesso!");
                }
            } else {
                toast.warn("Permissão para notificações foi negada.");
            }
        } catch (error) {
            toast.error("Ocorreu um erro ao ativar as notificações.");
        } finally {
            setShowNotificationModal(false);
        }
    };

    useEffect(() => {
        const hasAskedForNotifications = localStorage.getItem('notification_prompted');
        if (usuario && !hasAskedForNotifications) {
            setTimeout(() => {
                setShowNotificationModal(true);
                localStorage.setItem('notification_prompted', 'true');
            }, 3000);
        }
    }, [usuario]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // ✅ CORREÇÃO APLICADA AQUI: Adicionamos 'dadosMetas' à lista de desestruturação.
            const [
                dadosUsuario, dadosPesos, dadosChecklist, dadosConsultas, 
                dadosMedicationList, dadosLog, dadosConteudos, dadosMedicationLog, dadosMetas
            ] = await Promise.all([
                fetchApi('/api/me'),
                fetchApi('/api/pesos'),
                fetchApi('/api/checklist'),
                fetchApi('/api/consultas'),
                fetchApi('/api/medication/list'),
                fetchApi('/api/dailylog/today'),
                fetchApi('/api/conteudos'),
                fetchApi(`/api/medication/log/${today}`),
                fetchApi('/api/metas')
            ]);

            setUsuario(dadosUsuario);
            setPesos(dadosPesos.sort((a, b) => new Date(a.data) - new Date(b.data)));
            setChecklist(dadosChecklist);
            setConsultas(dadosConsultas.sort((a, b) => new Date(a.data) - new Date(b.data)));
            setMedicationData({ 
                medicamentos: dadosMedicationList.medicamentos || [], 
                logDoDia: dadosMedicationLog || { dosesTomadas: [] }
            });
            setDailyLog(dadosLog);
            setConteudos(dadosConteudos);
            setMetas(dadosMetas); // Agora 'dadosMetas' existe e o erro é resolvido.

        } catch (error) {
            if (!error.message.includes('Sessão expirada')) {
                toast.error(error.message || 'Erro ao carregar dados.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // O resto do seu ficheiro DashboardPage.js permanece exatamente igual...
    // ... (handleTrack, handleSetSurgeryDate, handleToggleMedToma, etc.)

    const handleTrack = async (type, amount) => {
        try {
            const data = await fetchApi('/api/dailylog/track', {
                method: 'POST',
                body: JSON.stringify({ type, amount })
            });
            
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
            const updatedUser = await fetchApi('/api/user/surgery-date', {
                method: 'PUT',
                body: JSON.stringify({ dataCirurgia: novaDataCirurgia })
            });
            setUsuario(updatedUser);
            setIsDateModalOpen(false);
            setNovaDataCirurgia('');
            toast.success('Data da cirurgia atualizada com sucesso!');
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleToggleMedToma = async (med, horario) => {
        const today = new Date().toISOString().split('T')[0];
        const doseInfo = {
            medicationId: med._id,
            nome: med.nome,
            horario: horario,
            dosagem: med.dosagem || `${med.quantidade} ${med.unidade}`
        };

        const originalState = { ...medicationData };
        setMedicationData(prev => {
            const foiTomado = prev.logDoDia.dosesTomadas.some(d => d.medicationId === med._id && d.horario === horario);
            const newDosesTomadas = foiTomado
                ? prev.logDoDia.dosesTomadas.filter(d => !(d.medicationId === med._id && d.horario === horario))
                : [...prev.logDoDia.dosesTomadas, doseInfo];
            return { ...prev, logDoDia: { ...prev.logDoDia, dosesTomadas: newDosesTomadas } };
        });

        try {
            const updatedLog = await fetchApi('/api/medication/log/toggle', {
                method: 'POST',
                body: JSON.stringify({ date: today, doseInfo })
            });
            setMedicationData(prev => ({ ...prev, logDoDia: updatedLog }));
        } catch (error) {
            toast.error("Erro ao registrar a toma. A reverter.");
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
        
        if (dailyLog && dailyLog.waterConsumed < (usuario.metaAguaDiaria || 2000)) {
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
                    {medicationData?.medicamentos?.length > 0 && 
                        <DailyMedicationCard 
                            medicamentos={medicationData.medicamentos} 
                            logDoDia={medicationData.logDoDia} 
                            onToggleToma={handleToggleMedToma}
                        />
                    }
                    <WeightProgressCard usuario={usuario} historicoPesos={pesos} />
                    {metas.length > 0 && <MetasCard metas={metas} />}
                </div>
                
                <div className="dashboard-coluna-secundaria">
                    <Card className="dashboard-card summary-card">
                        <h3><span className="card-icon">📌</span> Próximas Tarefas</h3>
                        {proximasTarefas.length > 0 ? (
                            <ul className="summary-list">
                                {proximasTarefas.map(task => <li key={task._id}>{task.descricao}</li>)}
                            </ul>
                        ) : (
                            <div className="summary-empty">
                                <span className="empty-icon">🎉</span>
                                <p>Nenhuma tarefa pendente!</p>
                                <Link to="/checklist" className="summary-action-btn">Adicionar Tarefa</Link>
                            </div>
                        )}
                    </Card>
                    <Card className="dashboard-card summary-card">
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

            <Modal isOpen={showNotificationModal} onClose={() => setShowNotificationModal(false)}>
                <h2>Ativar Notificações</h2>
                <p>Gostaria de ativar as notificações para receber atualizações importantes?</p>
                <div className="modal-actions">
                    <button onClick={handleEnableNotifications} className="primary-btn">Ativar</button>
                    <button onClick={() => setShowNotificationModal(false)} className="secondary-btn">Cancelar</button>
                </div>
            </Modal>

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
};

export default DashboardPage;