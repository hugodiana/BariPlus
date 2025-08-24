// client/src/pages/ProgressoPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

import './ProgressoPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import ProgressReport from '../components/PDFReport';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchApi } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const createChartData = (label, data, color) => ({
    labels: data.map(item => format(new Date(item.date), 'dd/MM')),
    datasets: [{ label, data: data.map(item => item.value), borderColor: color, backgroundColor: `${color}20`, fill: true, tension: 0.3 }]
});

const chartOptions = (title) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: true, text: title, font: { size: 14 } } },
    animation: { duration: 0 }
});

const allMeasures = {
    peso: { label: 'Peso (kg)', color: '#37715b' },
    pescoco: { label: 'Pescoço (cm)', color: '#e84393' },
    torax: { label: 'Tórax (cm)', color: '#0984e3' },
    cintura: { label: 'Cintura (cm)', color: '#00cec9' },
    abdomen: { label: 'Abdômen (cm)', color: '#6c5ce7' },
    quadril: { label: 'Quadril (cm)', color: '#ff7675' },
    bracoDireito: { label: 'Braço D. (cm)', color: '#fdcb6e' },
    bracoEsquerdo: { label: 'Braço E. (cm)', color: '#fd79a8' },
    antebracoDireito: { label: 'Antebraço D. (cm)', color: '#636e72' },
    antebracoEsquerdo: { label: 'Antebraço E. (cm)', color: '#2d3436' },
    coxaDireita: { label: 'Coxa D. (cm)', color: '#e17055' },
    coxaEsquerda: { label: 'Coxa E. (cm)', color: '#d63031' },
    panturrilhaDireita: { label: 'Panturrilha D. (cm)', color: '#00b894' },
    panturrilhaEsquerda: { label: 'Panturrilha E. (cm)', color: '#55efc4' },
};

const HighlightItem = ({ label, value, unit, status, isMain = false }) => (
    <div className={`highlight-item ${isMain ? 'main' : ''}`}>
        <span className="highlight-label">{label}</span>
        <span className={`highlight-value ${status || ''}`}>
            {value} <span className="highlight-unit">{unit}</span>
        </span>
    </div>
);


const DownloadPDFButton = ({ usuario, historico, chartDataSets }) => {
    const [chartImages, setChartImages] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [shouldRenderChartsForPDF, setShouldRenderChartsForPDF] = useState(false);

    useEffect(() => {
        if (!shouldRenderChartsForPDF) return;

        const generateImages = async () => {
            const images = {};
            const chartIds = Object.keys(chartDataSets);
            
            for (const id of chartIds) {
                const chartElement = document.getElementById(`pdf-chart-${id}`);
                if (chartElement) {
                    try {
                        const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff' });
                        images[id] = canvas.toDataURL('image/png', 0.9);
                    } catch (error) { console.error(`Erro ao gerar imagem para ${id}:`, error); }
                }
            }
            setChartImages(images);
            setIsGenerating(false);
            setShouldRenderChartsForPDF(false);
            toast.success("Gráficos prontos! Pode baixar o seu PDF.");
        };

        const timer = setTimeout(generateImages, 500);
        return () => clearTimeout(timer);
    }, [shouldRenderChartsForPDF, chartDataSets]);

    const handlePreparePDF = () => {
        setIsGenerating(true);
        toast.info("A preparar os gráficos para o relatório...");
        setShouldRenderChartsForPDF(true);
    };

    if (!usuario || historico.length === 0) return null;

    return (
        <>
            {chartImages ? (
                <PDFDownloadLink
                    document={<ProgressReport usuario={usuario} historico={historico} chartImages={chartImages} />}
                    fileName={`Relatorio_Progresso_${usuario.nome}_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                    className="pdf-link ready"
                >
                    {({ loading }) => (loading ? 'A preparar PDF...' : 'Baixar PDF Agora')}
                </PDFDownloadLink>
            ) : (
                <button onClick={handlePreparePDF} className="pdf-link generate" disabled={isGenerating}>
                    {isGenerating ? 'A gerar gráficos...' : 'Exportar Relatório'}
                </button>
            )}
            
            <div className="pdf-chart-studio">
                {shouldRenderChartsForPDF && Object.keys(chartDataSets).map(key =>
                    <div key={key} style={{ width: '500px', height: '300px' }} id={`pdf-chart-${key}`}>
                        <Line data={createChartData(chartDataSets[key].label, chartDataSets[key].data, chartDataSets[key].color)} options={chartOptions(chartDataSets[key].label)} />
                    </div>
                )}
            </div>
        </>
    );
};

const ProgressoPage = () => {
    const [historico, setHistorico] = useState([]);
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [registroEmEdicao, setRegistroEmEdicao] = useState(null);
    const [activeChart, setActiveChart] = useState('peso');
    const [comparePhotos, setComparePhotos] = useState({ foto1: null, foto2: null });
    const [previewImage, setPreviewImage] = useState(null);
    const [timeFilter, setTimeFilter] = useState('all'); // ✅ NOVO ESTADO PARA O FILTRO

    const [formState, setFormState] = useState({
        peso: '', data: new Date().toISOString().split('T')[0], foto: null, notas: '', // ✅ ADICIONADO 'notas'
        cintura: '', quadril: '', pescoco: '', torax: '', abdomen: '',
        bracoDireito: '', bracoEsquerdo: '', antebracoDireito: '', antebracoEsquerdo: '',
        coxaDireita: '', coxaEsquerda: '', panturrilhaDireita: '', panturrilhaEsquerda: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dataPesos, dataMe] = await Promise.all([ 
                fetchApi('/api/pesos'), 
                fetchApi('/api/me') 
            ]);
            
            setHistorico(dataPesos.sort((a, b) => new Date(a.data) - new Date(b.data)));
            setUsuario(dataMe);
        } catch (error) { 
            toast.error(error.message || "Falha ao carregar os dados."); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    // ... (cálculos de imc, pep, etc. permanecem iguais)
    const { imcAtual, pep, categoriaIMC } = useMemo(() => {
        if (!usuario || !usuario.detalhesCirurgia?.pesoAtual || !usuario.detalhesCirurgia.altura) {
            return { imcAtual: 0, pep: 0, categoriaIMC: 'Dados insuficientes' };
        }
        
        const pesoAtual = usuario.detalhesCirurgia.pesoAtual;
        const altura = usuario.detalhesCirurgia.altura;
        const pesoInicial = usuario.detalhesCirurgia.pesoInicial;
        const metaPeso = usuario.metaPeso;

        const alturaMetros = altura / 100;
        const imc = altura > 0 ? (pesoAtual / (alturaMetros * alturaMetros)) : 0;

        let categoria = '';
        if (imc > 0) {
            if (imc < 18.5) categoria = 'Abaixo do peso';
            else if (imc < 24.9) categoria = 'Peso normal';
            else if (imc < 29.9) categoria = 'Sobrepeso';
            else if (imc < 34.9) categoria = 'Obesidade I';
            else if (imc < 39.9) categoria = 'Obesidade II';
            else categoria = 'Obesidade III';
        }

        const pesoAPerder = pesoInicial - metaPeso;
        const pesoPerdido = pesoInicial - pesoAtual;
        const pepCalculado = (pesoAPerder > 0 && pesoPerdido > 0) ? (pesoPerdido / pesoAPerder) * 100 : 0;
        
        return {
            imcAtual: imc,
            pep: pepCalculado,
            categoriaIMC: categoria
        };
    }, [usuario]);


    const handleSelectForCompare = (foto) => {
        if (!comparePhotos.foto1) {
            setComparePhotos({ foto1: foto, foto2: null });
            toast.info("Ótimo! Agora selecione a segunda foto para comparar.");
        } else if (comparePhotos.foto1._id !== foto._id) {
            if (new Date(foto.data) < new Date(comparePhotos.foto1.data)) {
                setComparePhotos({ foto1: foto, foto2: comparePhotos.foto1 });
            } else {
                setComparePhotos(prev => ({ ...prev, foto2: foto }));
            }
        }
    };
    const handleClearCompare = () => setComparePhotos({ foto1: null, foto2: null });
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormState(prev => ({ ...prev, foto: file }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };
    const handleOpenAddModal = () => {
        setRegistroEmEdicao(null);
        setFormState({
            peso: '', data: new Date().toISOString().split('T')[0], foto: null, notas: '',
            cintura: '', quadril: '', pescoco: '', torax: '', abdomen: '', bracoDireito: '',
            bracoEsquerdo: '', antebracoDireito: '', antebracoEsquerdo: '', coxaDireita: '',
            coxaEsquerda: '', panturrilhaDireita: '', panturrilhaEsquerda: ''
        });
        setPreviewImage(null);
        setIsModalOpen(true);
    };
    const handleOpenEditModal = (registro) => {
        setRegistroEmEdicao(registro);
        setFormState({
            peso: registro.peso || '',
            data: format(parseISO(registro.data), 'yyyy-MM-dd'),
            foto: null,
            notas: registro.notas || '', // ✅ CARREGAR NOTAS
            cintura: registro.medidas?.cintura || '',
            quadril: registro.medidas?.quadril || '',
            pescoco: registro.medidas?.pescoco || '',
            torax: registro.medidas?.torax || '',
            abdomen: registro.medidas?.abdomen || '',
            bracoDireito: registro.medidas?.bracoDireito || '',
            bracoEsquerdo: registro.medidas?.bracoEsquerdo || '',
            antebracoDireito: registro.medidas?.antebracoDireito || '',
            antebracoEsquerdo: registro.medidas?.antebracoEsquerdo || '',
            coxaDireita: registro.medidas?.coxaDireita || '',
            coxaEsquerda: registro.medidas?.coxaEsquerda || '',
            panturrilhaDireita: registro.medidas?.panturrilhaDireita || '',
            panturrilhaEsquerda: registro.medidas?.panturrilhaEsquerda || ''
        });
        setPreviewImage(registro.fotoUrl || null);
        setIsModalOpen(true);
    };
    const handleSubmitProgresso = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        Object.keys(formState).forEach(key => {
            if (formState[key]) formDataToSend.append(key, formState[key]);
        });
        const isEditing = !!registroEmEdicao;
        const url = isEditing ? `/api/pesos/${registroEmEdicao._id}` : `/api/pesos`;
        const method = isEditing ? 'PUT' : 'POST';
        const token = localStorage.getItem('bariplus_token');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}${url}`, { 
                method, 
                headers: { 'Authorization': `Bearer ${token}` },
                body: formDataToSend 
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Falha ao ${isEditing ? 'atualizar' : 'salvar'}`);
            }
            toast.success(`Registro ${isEditing ? 'atualizado' : 'adicionado'}!`);
            setIsModalOpen(false);
            fetchData();
        } catch (error) { toast.error(error.message); }
    };
    const handleDeleteProgresso = async (registroId) => {
        if (!window.confirm("Tem certeza?")) return;
        try {
            await fetchApi(`/api/pesos/${registroId}`, { method: 'DELETE' });
            toast.info("Registro apagado.");
            fetchData();
        } catch (error) { toast.error("Erro ao apagar."); }
    };
    
    const chartDataSets = useMemo(() => {
        if (historico.length < 1) return {};
        
        // ✅ FILTRAR O HISTÓRICO COM BASE NO ESTADO 'timeFilter'
        let historicoFiltrado = [...historico];
        const hoje = new Date();
        if (timeFilter !== 'all') {
            let dataInicio;
            if (timeFilter === '30d') {
                dataInicio = subDays(hoje, 30);
            } else if (timeFilter === '6m') {
                dataInicio = subDays(hoje, 180);
            } else if (timeFilter === 'surgery' && usuario?.detalhesCirurgia?.dataCirurgia) {
                dataInicio = parseISO(usuario.detalhesCirurgia.dataCirurgia);
            }
            if (dataInicio) {
                historicoFiltrado = historico.filter(h => new Date(h.data) >= dataInicio);
            }
        }
        
        const historicoAsc = historicoFiltrado.sort((a, b) => new Date(a.data) - new Date(b.data));
        
        const datasets = {};
        for (const key in allMeasures) {
            const measure = allMeasures[key];
            const data = (key === 'peso')
                ? historicoAsc.map(h => ({ date: h.data, value: h.peso })).filter(item => item.value != null)
                : historicoAsc.map(h => ({ date: h.data, value: h.medidas?.[key] })).filter(item => item.value != null);
            
            if (data.length > 0) {
                datasets[key] = { label: measure.label, data: data, color: measure.color };
            }
        }
        return datasets;
    }, [historico, timeFilter, usuario]);


    if (loading || !usuario) return <LoadingSpinner />;
    
    const fotosDoHistorico = historico.filter(item => item.fotoUrl).sort((a, b) => new Date(b.data) - new Date(a.data));
    const chartToShow = chartDataSets[activeChart];

    return (
        <div className="page-container">
            <div className="page-header-actions">
                <div className="page-header"><h1>Meu Progresso</h1><p>Acompanhe a sua evolução de peso e medidas.</p></div>
                <div className="header-buttons">
                    <DownloadPDFButton usuario={usuario} historico={historico} chartDataSets={chartDataSets} />
                    <button className="add-btn" onClick={handleOpenAddModal}>+ Novo Registro</button>
                </div>
            </div>

            <Card className="summary-highlights-card">
                <HighlightItem label="Peso Atual" value={(usuario.detalhesCirurgia?.pesoAtual || 0).toFixed(1)} unit="kg" isMain />
                <HighlightItem label="IMC Atual" value={imcAtual.toFixed(1)} unit={categoriaIMC} status="imc" />
                <HighlightItem label="Total Perdido" value={(usuario.detalhesCirurgia?.pesoInicial - usuario.detalhesCirurgia?.pesoAtual).toFixed(1)} unit="kg" />
                <HighlightItem label="% Perda de Excesso de Peso" value={pep.toFixed(1)} unit="%" isMain />
            </Card>

            <Card>
                <div className="chart-controls">
                    <div className="chart-selector">
                        {Object.keys(chartDataSets).map(key => (
                            <button key={key} className={`chart-selector-btn ${activeChart === key ? 'active' : ''}`} onClick={() => setActiveChart(key)}>
                                {chartDataSets[key].label}
                            </button>
                        ))}
                    </div>
                    {/* ✅ BOTÕES DE FILTRO DE TEMPO */}
                    <div className="time-filter">
                        <button className={timeFilter === '30d' ? 'active' : ''} onClick={() => setTimeFilter('30d')}>30D</button>
                        <button className={timeFilter === '6m' ? 'active' : ''} onClick={() => setTimeFilter('6m')}>6M</button>
                        {usuario?.detalhesCirurgia?.dataCirurgia && <button className={timeFilter === 'surgery' ? 'active' : ''} onClick={() => setTimeFilter('surgery')}>Pós-Op</button>}
                        <button className={timeFilter === 'all' ? 'active' : ''} onClick={() => setTimeFilter('all')}>Tudo</button>
                    </div>
                </div>

                {chartToShow?.data.length > 1 ? (
                    <div id={`${activeChart}-chart`} className="chart-container">
                        <Line options={chartOptions(chartToShow.label)} data={createChartData(chartToShow.label, chartToShow.data, chartToShow.color)} />
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>Adicione pelo menos dois registos com a medida e período selecionados para ver o gráfico de evolução.</p>
                    </div>
                )}
            </Card>

            {fotosDoHistorico.length > 0 && (
                <Card>
                    <h3>Galeria de Fotos</h3>
                    {comparePhotos.foto1 && comparePhotos.foto2 ? (
                        <div className="compare-slider-wrapper">
                            <ReactCompareSlider itemOne={<ReactCompareSliderImage src={comparePhotos.foto1.fotoUrl} alt="Antes" />} itemTwo={<ReactCompareSliderImage src={comparePhotos.foto2.fotoUrl} alt="Depois" />} />
                            <div className="compare-labels"><div><strong>{format(new Date(comparePhotos.foto1.data), 'dd/MM/yy')}</strong><span>{comparePhotos.foto1.peso.toFixed(1)} kg</span></div><div><strong>{format(new Date(comparePhotos.foto2.data), 'dd/MM/yy')}</strong><span>{comparePhotos.foto2.peso.toFixed(1)} kg</span></div></div>
                            <button className="clear-compare-btn" onClick={handleClearCompare}>Limpar Comparação</button>
                        </div>
                    ) : ( <p className="gallery-instructions">Clique em duas fotos para criar uma comparação interativa de "antes e depois".</p> )}
                    <div className="photo-gallery">{fotosDoHistorico.map(item => (<div key={item._id} className={`photo-item ${comparePhotos.foto1?._id === item._id || comparePhotos.foto2?._id === item._id ? 'selected' : ''}`} onClick={() => handleSelectForCompare(item)}><img src={item.fotoUrl} alt={`Progresso em ${format(new Date(item.data), 'dd/MM/yyyy')}`} /><time>{format(new Date(item.data), 'dd MMM yyyy', { locale: ptBR })}</time></div>))}</div>
                </Card>
            )}
            
            <Card>
                <h3>Histórico Completo</h3>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                {Object.keys(allMeasures).map(key => <th key={key}>{allMeasures[key].label}</th>)}
                                <th>Notas</th>{/* ✅ NOVA COLUNA */}
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historico.slice().reverse().map(item => (
                                <tr key={item._id}>
                                    <td>{format(new Date(item.data), 'dd/MM/yyyy')}</td>
                                    {Object.keys(allMeasures).map(key => (
                                        <td key={key}>{key === 'peso' ? (item.peso?.toFixed(1) || '-') : (item.medidas?.[key] || '-')}</td>
                                    ))}
                                    {/* ✅ CÉLULA PARA AS NOTAS */}
                                    <td className="notes-cell" title={item.notas}>{item.notas ? '📝' : '-'}</td>
                                    <td className="actions-cell">
                                        <button onClick={() => handleOpenEditModal(item)} className="action-btn edit-btn">✎</button>
                                        <button onClick={() => handleDeleteProgresso(item._id)} className="action-btn delete-btn">×</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>{registroEmEdicao ? 'Editar Registro' : 'Novo Registro'}</h2>
                <form onSubmit={handleSubmitProgresso} className="progresso-form">
                    <div className="form-row">
                        <div className="form-group"><label>Peso (kg) *</label><input name="peso" type="number" step="0.1" value={formState.peso} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Data</label><input name="data" type="date" value={formState.data} onChange={handleInputChange} required /></div>
                    </div>
                    <h4>Medidas (Opcional)</h4>
                    <div className="medidas-grid">{Object.keys(allMeasures).filter(k => k !== 'peso').map(key => (<div className="form-group" key={key}><label>{allMeasures[key].label}</label><input name={key} type="number" step="0.1" value={formState[key]} onChange={handleInputChange} /></div>))}</div>
                    {/* ✅ CAMPO DE TEXTO PARA AS NOTAS */}
                    <div className="form-group">
                        <label>Notas (Opcional)</label>
                        <textarea name="notas" value={formState.notas} onChange={handleInputChange} placeholder="Como se sentiu esta semana? Alguma observação importante?" />
                    </div>
                    <div className="form-group">
                        <label>Foto de Progresso</label>
                        <div className="image-uploader">
                            <input type="file" name="foto" id="fotoUpload" accept="image/png, image/jpeg" onChange={handleFileChange} className="image-input" />
                            <label htmlFor="fotoUpload" className="image-drop-zone">{previewImage ? <img src={previewImage} alt="Pré-visualização" className="image-preview" /> : <span>Clique ou arraste uma foto aqui</span>}</label>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="primary-btn">{registroEmEdicao ? 'Salvar' : 'Adicionar'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProgressoPage;