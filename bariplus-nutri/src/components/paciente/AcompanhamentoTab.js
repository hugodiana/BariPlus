// src/components/paciente/AcompanhamentoTab.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Line } from 'react-chartjs-2';
// ✅ 1. IMPORTAR TUDO O QUE É NECESSÁRIO DO CHART.JS
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { fetchApi } from '../../utils/api';
import Card from '../ui/Card';
import LoadingSpinner from '../LoadingSpinner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';
import NutriReportPDF from './NutriReportPDF';
import '../../pages/PacientesPage.css';

// ✅ 2. REGISTAR TODOS OS COMPONENTES DO GRÁFICO
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CommentForm = ({ pacienteId, date, mealType, itemId, onCommentAdded }) => {
    const [text, setText] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        try {
            const updatedDiary = await fetchApi(`/api/nutri/paciente/${pacienteId}/diario/${date}/comment`, {
                method: 'POST',
                body: JSON.stringify({ mealType, itemId, text })
            });
            onCommentAdded(updatedDiary);
            setText('');
            toast.success('Comentário adicionado!');
        } catch (error) {
            toast.error('Erro ao adicionar comentário.');
        }
    };
    return (
        <form onSubmit={handleSubmit} className="comment-form">
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Adicionar um comentário..." />
            <button type="submit">Enviar</button>
        </form>
    );
};

const AcompanhamentoTab = ({ paciente, nutricionista }) => {
    const { pacienteId } = useParams();
    const [planos, setPlanos] = useState([]);
    const [progresso, setProgresso] = useState(null);
    const [diario, setDiario] = useState(null);
    const [hidratacao, setHidratacao] = useState(null);
    const [medicacao, setMedicacao] = useState(null);
    const [exames, setExames] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [chartImage, setChartImage] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const fetchDataForDate = useCallback(async (date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        try {
            const [diarioData, hidratacaoData, medicacaoData] = await Promise.all([
                fetchApi(`/api/nutri/paciente/${pacienteId}/diario/${dateString}`),
                fetchApi(`/api/nutri/paciente/${pacienteId}/hidratacao/${dateString}`),
                fetchApi(`/api/nutri/paciente/${pacienteId}/medicacao/${dateString}`)
            ]);
            setDiario(diarioData);
            setHidratacao(hidratacaoData);
            setMedicacao(medicacaoData);
        } catch (error) {
            toast.error("Erro ao carregar dados do dia.");
        }
    }, [pacienteId]);

    useEffect(() => {
        const fetchDependentData = async () => {
            setLoading(true);
            try {
                const [planosData, progressoData, examesData] = await Promise.all([
                    fetchApi(`/api/nutri/pacientes/${pacienteId}/planos`),
                    fetchApi(`/api/nutri/paciente/${pacienteId}/progresso`),
                    fetchApi(`/api/nutri/paciente/${pacienteId}/exames`)
                ]);
                setPlanos(planosData);
                setProgresso(progressoData);
                setExames(examesData);
                await fetchDataForDate(selectedDate);
            } catch (error) {
                toast.error(error.message || "Erro ao carregar detalhes do paciente.");
            } finally {
                setLoading(false);
            }
        };
        fetchDependentData();
    }, [pacienteId, fetchDataForDate, selectedDate]);
    
    const changeDate = (amount) => {
        setSelectedDate(current => amount > 0 ? addDays(current, 1) : subDays(current, 1));
    };
    
    const handlePreparePDF = async () => {
        setIsGeneratingPDF(true);
        toast.info("A gerar o gráfico para o relatório...");
        try {
            const chartElement = document.getElementById('progresso-chart');
            if (!chartElement) {
                throw new Error("Elemento do gráfico não encontrado.");
            }
            const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff' });
            setChartImage(canvas.toDataURL('image/png', 1.0));
            toast.success("Relatório pronto para download!");
        } catch (error) {
            toast.error("Não foi possível gerar a imagem do gráfico.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    if (loading) return <LoadingSpinner />;

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
        <div className="paciente-dashboard-grid">
            <div className="main-column">
                <div className="report-actions">
                    {chartImage ? (
                        <PDFDownloadLink
                            document={<NutriReportPDF nutricionista={nutricionista} paciente={paciente} progresso={progresso} chartImage={chartImage} />}
                            fileName={`Relatorio_${paciente?.nome}_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                            className="action-btn-positive"
                        >
                            {({ loading }) => (loading ? 'A gerar PDF...' : 'Baixar PDF Agora')}
                        </PDFDownloadLink>
                    ) : (
                        <button onClick={handlePreparePDF} disabled={isGeneratingPDF} className="action-btn-positive">
                            {isGeneratingPDF ? 'A preparar...' : 'Gerar Relatório em PDF'}
                        </button>
                    )}
                </div>

                <Card className="progresso-summary">
                    <div><span>Peso Inicial</span><strong>{pesoInicial.toFixed(1)} kg</strong></div>
                    <div><span>Peso Atual</span><strong>{pesoAtual.toFixed(1)} kg</strong></div>
                    <div><span>Total Perdido</span><strong className="perdido">{pesoPerdido.toFixed(1)} kg</strong></div>
                </Card>

                {progresso?.historico && progresso.historico.length > 1 && (
                    <Card>
                        <h3>Evolução do Peso</h3>
                        <div className="chart-container" id="progresso-chart">
                            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, animation: false }} />
                        </div>
                    </Card>
                )}
                
                 <Card>
                         <div className="card-header-action">
                             <h3>Registos do Dia</h3>
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
                                                <li key={item._id} className="food-item-with-comments">
                                                    <div className="food-item-details">
                                                        <span>{item.name} ({item.portion}g)</span>
                                                        <span>{item.nutrients.calories.toFixed(0)} kcal</span>
                                                    </div>
                                                    {item.comments && item.comments.length > 0 && (
                                                        <div className="comments-section">
                                                            {item.comments.map(c => <p key={c._id} className="comment"><strong>Nutri:</strong> {c.text}</p>)}
                                                        </div>
                                                    )}
                                                    <CommentForm 
                                                        pacienteId={pacienteId} 
                                                        date={format(selectedDate, 'yyyy-MM-dd')}
                                                        mealType={key}
                                                        itemId={item._id}
                                                        onCommentAdded={setDiario}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data-message">Nenhum registo alimentar para este dia.</p>
                            )}
                        </div>
                        
                        <div className="additional-logs">
                            <div className="log-section">
                                <h3>Hidratação</h3>
                                {hidratacao?.entries?.length > 0 ? (
                                    <ul>{hidratacao.entries.map(h => <li key={h._id}><span>{h.type}</span><span>{h.amount} ml</span></li>)}</ul>
                                ) : <p>Nenhum registo.</p>}
                            </div>
                            <div className="log-section">
                                <h3>Medicação</h3>
                                {medicacao?.dosesTomadas?.length > 0 ? (
                                    <ul>{medicacao.dosesTomadas.map(m => <li key={m._id || m.horario}><span>{m.nome}</span><span>{m.horario}</span></li>)}</ul>
                                ) : <p>Nenhuma dose marcada.</p>}
                            </div>
                        </div>
                    </Card>

                {exames && exames.examEntries.length > 0 && (
                    <Card>
                        <h3>Histórico de Exames</h3>
                        <div className="exames-viewer-list">
                            {exames.examEntries.map(exam => (
                                <div key={exam._id} className="exame-item-viewer">
                                    <h4>{exam.name} ({exam.unit})</h4>
                                    <ul>
                                        {exam.history.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map(h => (
                                            <li key={h._id}>
                                                <span>{format(parseISO(h.date), 'dd/MM/yy')}</span>
                                                <strong>{h.value}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
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
    );
};

export default AcompanhamentoTab;