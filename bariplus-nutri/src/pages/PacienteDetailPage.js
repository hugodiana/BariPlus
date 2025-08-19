// src/pages/PacienteDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
// CORREÇÃO: Funções 'addDays' e 'subDays' que estavam em falta foram adicionadas
import { format, addDays, subDays } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import Modal from '../components/Modal';
import ChatBox from '../components/chat/ChatBox';
import LoadingSpinner from '../components/LoadingSpinner';
import './PacientesPage.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PacienteDetailPage = () => {
    const { pacienteId } = useParams();
    const [paciente, setPaciente] = useState(null);
    const [planos, setPlanos] = useState([]);
    const [progresso, setProgresso] = useState(null);
    const [diario, setDiario] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    const nutricionista = JSON.parse(localStorage.getItem('nutri_data'));

    // Função otimizada que busca todos os dados iniciais
    const fetchInitialDetails = useCallback(async () => {
        setLoading(true);
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        try {
            const [pacienteData, planosData, progressoData, diarioData] = await Promise.all([
                fetchApi(`/api/nutri/pacientes/${pacienteId}`),
                fetchApi(`/api/nutri/pacientes/${pacienteId}/planos`),
                fetchApi(`/api/nutri/paciente/${pacienteId}/progresso`),
                fetchApi(`/api/nutri/paciente/${pacienteId}/diario/${dateString}`)
            ]);
            
            setPaciente(pacienteData);
            setPlanos(planosData);
            setProgresso(progressoData);
            setDiario(diarioData);

        } catch (error) {
            toast.error(error.message || "Erro ao carregar detalhes do paciente.");
        } finally {
            setLoading(false);
        }
    }, [pacienteId, selectedDate]);

    // Função que busca apenas o diário, para quando a data muda
    const fetchDiario = useCallback(async (date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        try {
             const diarioData = await fetchApi(`/api/nutri/paciente/${pacienteId}/diario/${dateString}`);
             setDiario(diarioData);
        } catch(error) {
            toast.error("Erro ao carregar diário alimentar.");
        }
    }, [pacienteId]);

    // Busca todos os dados na primeira vez que a página carrega
    useEffect(() => {
        fetchInitialDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Busca apenas o diário alimentar quando a data é alterada
    useEffect(() => {
        // Evita a busca inicial duplicada
        if (!loading) { 
            fetchDiario(selectedDate);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const changeDate = (amount) => {
        setSelectedDate(current => amount > 0 ? addDays(current, 1) : subDays(current, 1));
    };

    if (loading) return <LoadingSpinner />;
    if (!paciente) return (
        <div className="page-container">
            <Link to="/pacientes" className="back-link">‹ Voltar para a lista</Link>
            <p>Não foi possível carregar os dados do paciente.</p>
        </div>
    );
    
    const pesoInicial = progresso?.detalhes?.detalhesCirurgia?.pesoInicial || 0;
    const pesoAtual = progresso?.detalhes?.detalhesCirurgia?.pesoAtual || 0;
    const pesoPerdido = pesoInicial - pesoAtual;

    const chartData = {
        labels: progresso?.historico.map(p => format(new Date(p.data), 'dd/MM/yy')) || [],
        datasets: [{
            label: 'Peso (kg)',
            data: progresso?.historico.map(p => p.peso) || [],
            borderColor: 'rgb(55, 113, 91)',
            backgroundColor: 'rgba(55, 113, 91, 0.2)',
            fill: true,
        }],
    };
    
    const totaisDoDia = diario?.refeicoes ? Object.values(diario.refeicoes).flat().reduce((totals, item) => {
        totals.calories += item.nutrients.calories || 0;
        totals.proteins += item.nutrients.proteins || 0;
        return totals;
    }, { calories: 0, proteins: 0 }) : { calories: 0, proteins: 0 };

    return (
        <div className="page-container">
            <Link to="/pacientes" className="back-link">‹ Voltar para a lista</Link>
            <div className="page-header-action">
                <div className="page-header">
                    <h1>{paciente.nome} {paciente.sobrenome}</h1>
                    <p>Acompanhe e gira os planos alimentares e o progresso deste paciente.</p>
                </div>
                <button className="chat-btn" onClick={() => setIsChatOpen(true)}>💬 Enviar Mensagem</button>
            </div>
            
            <div className="paciente-dashboard-grid">
                <div className="main-column">
                    <Card className="progresso-summary">
                        <div><span>Peso Inicial</span><strong>{pesoInicial.toFixed(1)} kg</strong></div>
                        <div><span>Peso Atual</span><strong>{pesoAtual.toFixed(1)} kg</strong></div>
                        <div><span>Total Perdido</span><strong className="perdido">{pesoPerdido.toFixed(1)} kg</strong></div>
                    </Card>

                    {progresso?.historico && progresso.historico.length > 1 && (
                        <Card>
                            <h3>Evolução do Peso</h3>
                            <div className="chart-container">
                                <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>
                        </Card>
                    )}

                    <Card>
                         <div className="card-header-action">
                             <h3>Diário Alimentar do Dia</h3>
                             <div className="date-selector-diario">
                                <button onClick={() => changeDate(-1)}>‹</button>
                                <span>{format(selectedDate, 'dd/MM/yyyy')}</span>
                                <button onClick={() => changeDate(1)}>›</button>
                             </div>
                        </div>
                        <div className="diario-header-totals">
                            <span>Total de Calorias: <strong>{totaisDoDia.calories.toFixed(0)} kcal</strong></span>
                            <span>Total de Proteínas: <strong>{totaisDoDia.proteins.toFixed(1)} g</strong></span>
                        </div>
                        <div className="diario-grid">
                            {diario && Object.keys(diario.refeicoes).length > 0 && Object.values(diario.refeicoes).some(arr => arr.length > 0) ? (
                                Object.entries(diario.refeicoes).map(([key, value]) => value.length > 0 && (
                                    <div key={key} className="refeicao-viewer">
                                        <h4>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                                        <ul>
                                            {value.map(item => (
                                                <li key={item._id}>
                                                    <span>{item.name} ({item.portion}g)</span>
                                                    <span>{item.nutrients.calories.toFixed(0)} kcal</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data-message">Nenhum registo alimentar para este dia.</p>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="side-column">
                    <Card>
                        <div className="card-header-action">
                            <h3>Planos Alimentares</h3>
                            <Link to={`/paciente/${pacienteId}/plano/criar`} className="action-btn-positive">
                                + Criar
                            </Link>
                        </div>
                        {planos.length > 0 ? (
                            <ul className="planos-list">
                                {planos.map(plano => (
                                    <li key={plano._id} className={`plano-item ${plano.ativo ? 'ativo' : 'inativo'}`}>
                                        <Link to={`/paciente/${pacienteId}/plano/${plano._id}`} className="plano-link">
                                            <div className="plano-info">
                                                <strong>{plano.titulo}</strong>
                                                <span>{format(new Date(plano.createdAt), 'dd/MM/yy', { locale: ptBR })}</span>
                                            </div>
                                            <span className="plano-status">{plano.ativo ? 'Ativo' : 'Arquivado'}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Nenhum plano alimentar criado.</p>
                        )}
                    </Card>
                </div>
            </div>

            <Modal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}>
                <h2>Conversa com {paciente.nome}</h2>
                <ChatBox currentUser={nutricionista} receiver={paciente} />
            </Modal>
        </div>
    );
};

export default PacienteDetailPage;