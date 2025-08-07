import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';

import './ProgressoPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import ProgressReport from '../components/PDFReport';
import LoadingSpinner from '../components/LoadingSpinner';

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

const DownloadPDFButton = ({ usuario, historico }) => {
    const [chartImages, setChartImages] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        setIsGenerating(true);
        toast.info("A preparar o seu relatório PDF...");
        
        setTimeout(async () => {
            const chartIds = ['peso-chart', 'cintura-chart', 'quadril-chart', 'braco-d-chart'];
            const images = {};
            
            for (const id of chartIds) {
                const chartElement = document.getElementById(id);
                if (chartElement) {
                    try {
                        const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff' });
                        images[id] = canvas.toDataURL('image/png', 0.9);
                    } catch (error) {
                        console.error(`Erro ao gerar imagem para o gráfico ${id}:`, error);
                    }
                }
            }
            setChartImages(images);
            setIsGenerating(false);
            toast.success("Gráficos prontos! Pode baixar o seu PDF.");
        }, 100);
    };

    if (!usuario || historico.length === 0) return null;

    if (chartImages) {
        return (
            <PDFDownloadLink
                document={<ProgressReport usuario={usuario} historico={historico} chartImages={chartImages} />}
                fileName={`Relatorio_Progresso_${usuario.nome}_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                className="pdf-link ready"
            >
                {({ loading }) => (loading ? 'A preparar...' : 'Baixar PDF Agora')}
            </PDFDownloadLink>
        );
    }

    return (
        <button onClick={generatePDF} className="pdf-link generate" disabled={isGenerating}>
            {isGenerating ? 'A gerar gráficos...' : 'Exportar para PDF'}
        </button>
    );
};

const ProgressoPage = () => {
    const [historico, setHistorico] = useState([]);
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [registroEmEdicao, setRegistroEmEdicao] = useState(null);
    
    const [formState, setFormState] = useState({
        peso: '', data: new Date().toISOString().split('T')[0], cintura: '', quadril: '', pescoco: '', torax: '', abdomen: '',
        bracoDireito: '', bracoEsquerdo: '', antebracoDireito: '', antebracoEsquerdo: '',
        coxaDireita: '', coxaEsquerda: '', panturrilhaDireita: '', panturrilhaEsquerda: '', foto: null
    });

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resPesos, resMe] = await Promise.all([
                fetch(`${apiUrl}/api/pesos`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!resPesos.ok || !resMe.ok) throw new Error("Falha ao carregar os dados.");
            
            const dataPesos = await resPesos.json();
            const dataMe = await resMe.json();
            
            setHistorico(dataPesos.sort((a, b) => new Date(a.data) - new Date(b.data)));
            setUsuario(dataMe);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormState(prev => ({ ...prev, foto: e.target.files[0] }));
    };

    const resetForm = () => {
        setFormState({
            peso: '', cintura: '', quadril: '', pescoco: '', torax: '', abdomen: '',
            bracoDireito: '', bracoEsquerdo: '', antebracoDireito: '', antebracoEsquerdo: '',
            coxaDireita: '', coxaEsquerda: '', panturrilhaDireita: '', panturrilhaEsquerda: '', foto: null
        });
    };

    const handleOpenAddModal = () => {
        setRegistroEmEdicao(null);
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (registro) => {
        setRegistroEmEdicao(registro);
        setFormState({
            peso: registro.peso || '',
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
            panturrilhaEsquerda: registro.medidas?.panturrilhaEsquerda || '',
            foto: null
        });
        setIsModalOpen(true);
    };

    const handleSubmitProgresso = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(formState).forEach(key => {
            if (formState[key]) formData.append(key, formState[key]);
        });

        const isEditing = !!registroEmEdicao;
        const url = isEditing ? `${apiUrl}/api/pesos/${registroEmEdicao._id}` : `${apiUrl}/api/pesos`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            if (!response.ok) throw new Error(`Falha ao ${isEditing ? 'atualizar' : 'salvar'}`);
            
            toast.success(`Registro ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`);
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleDeleteProgresso = async (registroId) => {
        if (!window.confirm("Tem certeza que deseja apagar este registro? A ação não pode ser desfeita.")) return;
        try {
            const response = await fetch(`${apiUrl}/api/pesos/${registroId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Falha ao apagar registro.");
            
            toast.info("Registro apagado com sucesso.");
            fetchData();
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const { pesoPerdido, imc } = useMemo(() => {
        if (!usuario || !historico.length) return { pesoPerdido: 0, imc: 0 };
        const pesoInicial = usuario.detalhesCirurgia?.pesoInicial || 0;
        const pesoAtual = usuario.detalhesCirurgia?.pesoAtual || 0;
        const alturaEmMetros = (usuario.detalhesCirurgia?.altura || 0) / 100;
        const pesoPerdido = pesoInicial - pesoAtual;
        const imcValue = alturaEmMetros > 0 ? (pesoAtual / (alturaEmMetros * alturaEmMetros)) : 0;
        return { pesoPerdido, imc: imcValue };
    }, [usuario, historico]);
    
    const chartDataSets = useMemo(() => {
        if (historico.length === 0) return {};
        return {
            peso: createChartData('Peso', historico.map(h => ({ date: h.data, value: h.peso })), '#37715b'),
            cintura: createChartData('Cintura', historico.filter(h => h.medidas?.cintura).map(h => ({ date: h.data, value: h.medidas.cintura })), '#007aff'),
            quadril: createChartData('Quadril', historico.filter(h => h.medidas?.quadril).map(h => ({ date: h.data, value: h.medidas.quadril })), '#ff9f40'),
            bracoDireito: createChartData('Braço D.', historico.filter(h => h.medidas?.bracoDireito).map(h => ({ date: h.data, value: h.medidas.bracoDireito })), '#ff6384'),
        };
    }, [historico]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header-actions">
                <div className="page-header"><h1>Meu Progresso</h1><p>Acompanhe sua evolução de peso e medidas corporais.</p></div>
                <DownloadPDFButton usuario={usuario} historico={historico} />
            </div>
            <button className="add-btn" onClick={handleOpenAddModal}>+ Adicionar Novo Registro</button>

            {historico.length > 0 ? (
                <div className="progresso-content">
                    <div className="summary-stats-grid">
                        <Card className="stat-item-small"><h3>Peso Perdido</h3><p>{pesoPerdido.toFixed(1)} kg</p></Card>
                        <Card className="stat-item-small"><h3>IMC Atual</h3><p>{imc.toFixed(1)}</p></Card>
                    </div>

                    <div className="charts-grid">
                        {chartDataSets.peso?.datasets[0].data.length > 1 && <Card><div id="peso-chart" className="chart-container"><Line options={chartOptions('Evolução de Peso (kg)')} data={chartDataSets.peso} /></div></Card>}
                        {chartDataSets.cintura?.datasets[0].data.length > 1 && <Card><div id="cintura-chart" className="chart-container"><Line options={chartOptions('Evolução da Cintura (cm)')} data={chartDataSets.cintura} /></div></Card>}
                        {chartDataSets.quadril?.datasets[0].data.length > 1 && <Card><div id="quadril-chart" className="chart-container"><Line options={chartOptions('Evolução do Quadril (cm)')} data={chartDataSets.quadril} /></div></Card>}
                        {chartDataSets.bracoDireito?.datasets[0].data.length > 1 && <Card><div id="braco-d-chart" className="chart-container"><Line options={chartOptions('Evolução Braço Direito (cm)')} data={chartDataSets.bracoDireito} /></div></Card>}
                    </div>

                    {historico.filter(item => item.fotoUrl).length > 0 && (
                        <Card>
                            <h3>Galeria de Fotos</h3>
                            <div className="photo-gallery">{historico.filter(item => item.fotoUrl).map(item => (<div key={item._id} className="photo-item"><a href={item.fotoUrl} target="_blank" rel="noopener noreferrer"><img src={item.fotoUrl} alt={`Progresso em ${format(new Date(item.data), 'dd/MM/yyyy')}`} /></a><time>{format(new Date(item.data), 'dd MMM yyyy', { locale: ptBR })}</time></div>))}</div>
                        </Card>
                    )}
                    
                    <Card>
                        <h3>Histórico Completo</h3>
                        <div className="table-responsive">
                            <table>
                                <thead><tr><th>Data</th><th>Peso</th><th>Pescoço</th><th>Tórax</th><th>Cintura</th><th>Abdômen</th><th>Quadril</th><th>Braço D.</th><th>Braço E.</th><th>Ações</th></tr></thead>
                                <tbody>
                                    {[...historico].reverse().map(item => (
                                        <tr key={item._id}>
                                            <td>{format(new Date(item.data), 'dd/MM/yy')}</td>
                                            <td>{item.peso?.toFixed(1) || '-'}</td>
                                            <td>{item.medidas?.pescoco || '-'}</td>
                                            <td>{item.medidas?.torax || '-'}</td>
                                            <td>{item.medidas?.cintura || '-'}</td>
                                            <td>{item.medidas?.abdomen || '-'}</td>
                                            <td>{item.medidas?.quadril || '-'}</td>
                                            <td>{item.medidas?.bracoDireito || '-'}</td>
                                            <td>{item.medidas?.bracoEsquerdo || '-'}</td>
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
                </div>
            ) : (
                <div className="empty-state-container">
                    <h3>Sem Registros de Progresso</h3>
                    <p>Clique no botão para adicionar o seu primeiro registro de avaliação física.</p>
                    <button className="add-btn" onClick={handleOpenAddModal}>+ Adicionar Novo Registro</button>
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>{registroEmEdicao ? 'Editar Registro' : 'Novo Registro de Avaliação Física'}</h2>
                <form onSubmit={handleSubmitProgresso} className="progresso-form">
                    <label>Peso (kg) *</label>
                    <input name="peso" type="number" step="0.1" value={formState.peso} onChange={handleInputChange} required />
                    <hr/>
                    <div className="form-group">
                            <label htmlFor="data">Data do Registro</label>
                        
                    </div>
                    <h4>Circunferências (cm)</h4>
                    <div className="form-row"><div className="form-group"><label>Pescoço</label><input name="pescoco" type="number" step="0.1" value={formState.pescoco} onChange={handleInputChange} /></div><div className="form-group"><label>Tórax</label><input name="torax" type="number" step="0.1" value={formState.torax} onChange={handleInputChange} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Cintura</label><input name="cintura" type="number" step="0.1" value={formState.cintura} onChange={handleInputChange} /></div><div className="form-group"><label>Abdômen</label><input name="abdomen" type="number" step="0.1" value={formState.abdomen} onChange={handleInputChange} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Quadril</label><input name="quadril" type="number" step="0.1" value={formState.quadril} onChange={handleInputChange} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Braço Direito</label><input name="bracoDireito" type="number" step="0.1" value={formState.bracoDireito} onChange={handleInputChange} /></div><div className="form-group"><label>Braço Esquerdo</label><input name="bracoEsquerdo" type="number" step="0.1" value={formState.bracoEsquerdo} onChange={handleInputChange} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Antebraço Direito</label><input name="antebracoDireito" type="number" step="0.1" value={formState.antebracoDireito} onChange={handleInputChange} /></div><div className="form-group"><label>Antebraço Esquerdo</label><input name="antebracoEsquerdo" type="number" step="0.1" value={formState.antebracoEsquerdo} onChange={handleInputChange} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Coxa Direita</label><input name="coxaDireita" type="number" step="0.1" value={formState.coxaDireita} onChange={handleInputChange} /></div><div className="form-group"><label>Coxa Esquerda</label><input name="coxaEsquerda" type="number" step="0.1" value={formState.coxaEsquerda} onChange={handleInputChange} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Panturrilha Direita</label><input name="panturrilhaDireita" type="number" step="0.1" value={formState.panturrilhaDireita} onChange={handleInputChange} /></div><div className="form-group"><label>Panturrilha Esquerda</label><input name="panturrilhaEsquerda" type="number" step="0.1" value={formState.panturrilhaEsquerda} onChange={handleInputChange} /></div></div>
                    <hr/>
                    <label>Foto de Progresso (opcional)</label>
                    <input type="file" name="foto" accept="image/*" onChange={handleFileChange} />
                    <button type="submit">{registroEmEdicao ? 'Salvar Alterações' : 'Adicionar Registro'}</button>
                </form>
            </Modal>
        </div>
    );
};

export default ProgressoPage;