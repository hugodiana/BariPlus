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

// Função auxiliar para criar os dados para cada gráfico
const createChartData = (label, data, color) => ({
    labels: data.map(item => format(new Date(item.date), 'dd/MM')),
    datasets: [{
        label: label,
        data: data.map(item => item.value),
        borderColor: color,
        backgroundColor: `${color}1A`, // Cor com 10% de opacidade
        fill: true,
        tension: 0.3
    }]
});
const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        title: { display: true, text: title }
    },
    animation: { duration: 0 }
});

const DownloadPDFButton = ({ usuario, historico }) => {
    const [chartImage, setChartImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        setIsGenerating(true);
        toast.info("A preparar o seu relatório PDF...");
        
        setTimeout(async () => {
            const chartElement = document.getElementById('progress-chart-for-pdf'); // Assume um gráfico principal
            if (chartElement) {
                try {
                    const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff' });
                    setChartImage(canvas.toDataURL('image/png', 0.9));
                    toast.success("Gráfico pronto! Pode baixar o seu PDF.");
                } catch (error) {
                    toast.error("Erro ao gerar a imagem do gráfico.");
                    console.error("Erro html2canvas:", error);
                }
            } else {
                setChartImage('no-chart');
            }
            setIsGenerating(false);
        }, 100);
    };

    if (!usuario || historico.length === 0) return null;

    if (chartImage) {
        return (
            <PDFDownloadLink
                document={<ProgressReport usuario={usuario} historico={historico} chartImage={chartImage !== 'no-chart' ? chartImage : null} />}
                fileName={`Relatorio_Progresso_${usuario.nome}_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                className="pdf-link ready"
            >
                {({ loading }) => (loading ? 'A preparar...' : 'Baixar PDF Agora')}
            </PDFDownloadLink>
        );
    }

    return (
        <button onClick={generatePDF} className="pdf-link generate" disabled={isGenerating}>
            {isGenerating ? 'A gerar gráfico...' : 'Exportar para PDF'}
        </button>
    );
};

const ProgressoPage = () => {
    const [historico, setHistorico] = useState([]);
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Estados para todos os campos do formulário
    const [novoPeso, setNovoPeso] = useState('');
    const [cintura, setCintura] = useState('');
    const [quadril, setQuadril] = useState('');
    const [pescoco, setPescoco] = useState('');
    const [torax, setTorax] = useState('');
    const [abdomen, setAbdomen] = useState('');
    const [bracoDireito, setBracoDireito] = useState('');
    const [bracoEsquerdo, setBracoEsquerdo] = useState('');
    const [antebracoDireito, setAntebracoDireito] = useState('');
    const [antebracoEsquerdo, setAntebracoEsquerdo] = useState('');
    const [coxaDireita, setCoxaDireita] = useState('');
    const [coxaEsquerda, setCoxaEsquerda] = useState('');
    const [panturrilhaDireita, setPanturrilhaDireita] = useState('');
    const [panturrilhaEsquerda, setPanturrilhaEsquerda] = useState('');
    const [foto, setFoto] = useState(null);

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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFileChange = (e) => {
        setFoto(e.target.files[0]);
    };

    const handleSubmitProgresso = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('peso', novoPeso);
        formData.append('cintura', cintura);
        formData.append('quadril', quadril);
        formData.append('pescoco', pescoco);
        formData.append('torax', torax);
        formData.append('abdomen', abdomen);
        formData.append('bracoDireito', bracoDireito);
        formData.append('bracoEsquerdo', bracoEsquerdo);
        formData.append('antebracoDireito', antebracoDireito);
        formData.append('antebracoEsquerdo', antebracoEsquerdo);
        formData.append('coxaDireita', coxaDireita);
        formData.append('coxaEsquerda', coxaEsquerda);
        formData.append('panturrilhaDireita', panturrilhaDireita);
        formData.append('panturrilhaEsquerda', panturrilhaEsquerda);
        if (foto) formData.append('foto', foto);

        try {
            await fetch(`${apiUrl}/api/pesos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            toast.success('Progresso registrado com sucesso!');
            setIsModalOpen(false);
            // Limpa todos os campos
            setNovoPeso(''); setCintura(''); setQuadril(''); setPescoco(''); setTorax(''); setAbdomen('');
            setBracoDireito(''); setBracoEsquerdo(''); setAntebracoDireito(''); setAntebracoEsquerdo('');
            setCoxaDireita(''); setCoxaEsquerda(''); setPanturrilhaDireita(''); setPanturrilhaEsquerda('');
            setFoto(null);
            fetchData();
        } catch (error) {
            toast.error('Erro ao salvar progresso.');
        }
    };
    
    // Prepara os dados para todos os gráficos
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
                <div className="page-header">
                    <h1>Meu Progresso</h1>
                    <p>Acompanhe sua evolução de peso e medidas corporais.</p>
                </div>
                <DownloadPDFButton usuario={usuario} historico={historico} />
            </div>

            <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Adicionar Novo Registro</button>

            {historico.length > 0 ? (
                <div className="progresso-content">
                    <div className="charts-grid">
                        {chartDataSets.peso?.datasets[0].data.length > 1 && <Card><div className="chart-container" id="progress-chart-for-pdf"><Line options={chartOptions('Evolução de Peso (kg)')} data={chartDataSets.peso} /></div></Card>}
                        {chartDataSets.cintura?.datasets[0].data.length > 1 && <Card><div className="chart-container"><Line options={chartOptions('Evolução da Cintura (cm)')} data={chartDataSets.cintura} /></div></Card>}
                        {chartDataSets.quadril?.datasets[0].data.length > 1 && <Card><div className="chart-container"><Line options={chartOptions('Evolução do Quadril (cm)')} data={chartDataSets.quadril} /></div></Card>}
                        {chartDataSets.bracoDireito?.datasets[0].data.length > 1 && <Card><div className="chart-container"><Line options={chartOptions('Evolução Braço Direito (cm)')} data={chartDataSets.bracoDireito} /></div></Card>}
                    </div>

                    {historico.filter(item => item.fotoUrl).length > 0 && (
                        <Card>
                            <h3>Galeria de Fotos</h3>
                            <div className="photo-gallery">
                                {historico.filter(item => item.fotoUrl).map(item => (
                                    <div key={item._id} className="photo-item">
                                        <a href={item.fotoUrl} target="_blank" rel="noopener noreferrer">
                                            <img src={item.fotoUrl} alt={`Progresso em ${format(new Date(item.data), 'dd/MM/yyyy')}`} />
                                        </a>
                                        <time>{format(new Date(item.data), 'dd MMM yyyy', { locale: ptBR })}</time>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                    
                    <Card>
                        <h3>Histórico Completo</h3>
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Peso</th>
                                        <th>Pescoço</th>
                                        <th>Tórax</th>
                                        <th>Abdômen</th>
                                        <th>Cintura</th>
                                        <th>Quadril</th>
                                        <th>Braço D.</th>
                                        <th>Braço E.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...historico].reverse().map(item => (
                                        <tr key={item._id}>
                                            <td>{format(new Date(item.data), 'dd/MM/yy')}</td>
                                            <td>{item.peso?.toFixed(1) || '-'}</td>
                                            <td>{item.medidas?.pescoco || '-'}</td>
                                            <td>{item.medidas?.torax || '-'}</td>
                                            <td>{item.medidas?.abdomen || '-'}</td>
                                            <td>{item.medidas?.cintura || '-'}</td>
                                            <td>{item.medidas?.quadril || '-'}</td>
                                            <td>{item.medidas?.bracoDireito || '-'}</td>
                                            <td>{item.medidas?.bracoEsquerdo || '-'}</td>
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
                    <p>Clique no botão abaixo para adicionar o seu primeiro registro.</p>
                    <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Adicionar Novo Registro</button>
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Novo Registro de Avaliação Física</h2>
                <form onSubmit={handleSubmitProgresso} className="progresso-form">
                    <label>Peso (kg) *</label>
                    <input type="number" step="0.1" value={novoPeso} onChange={e => setNovoPeso(e.target.value)} required />
                    <hr/>
                    <h4>Circunferências (cm)</h4>
                    <div className="form-row"><div className="form-group"><label>Pescoço</label><input type="number" step="0.1" value={pescoco} onChange={e => setPescoco(e.target.value)} /></div><div className="form-group"><label>Tórax</label><input type="number" step="0.1" value={torax} onChange={e => setTorax(e.target.value)} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Cintura</label><input type="number" step="0.1" value={cintura} onChange={e => setCintura(e.target.value)} /></div><div className="form-group"><label>Abdômen</label><input type="number" step="0.1" value={abdomen} onChange={e => setAbdomen(e.target.value)} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Quadril</label><input type="number" step="0.1" value={quadril} onChange={e => setQuadril(e.target.value)} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Braço Direito</label><input type="number" step="0.1" value={bracoDireito} onChange={e => setBracoDireito(e.target.value)} /></div><div className="form-group"><label>Braço Esquerdo</label><input type="number" step="0.1" value={bracoEsquerdo} onChange={e => setBracoEsquerdo(e.target.value)} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Antebraço Direito</label><input type="number" step="0.1" value={antebracoDireito} onChange={e => setAntebracoDireito(e.target.value)} /></div><div className="form-group"><label>Antebraço Esquerdo</label><input type="number" step="0.1" value={antebracoEsquerdo} onChange={e => setAntebracoEsquerdo(e.target.value)} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Coxa Direita</label><input type="number" step="0.1" value={coxaDireita} onChange={e => setCoxaDireita(e.target.value)} /></div><div className="form-group"><label>Coxa Esquerda</label><input type="number" step="0.1" value={coxaEsquerda} onChange={e => setCoxaEsquerda(e.target.value)} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Panturrilha Direita</label><input type="number" step="0.1" value={panturrilhaDireita} onChange={e => setPanturrilhaDireita(e.target.value)} /></div><div className="form-group"><label>Panturrilha Esquerda</label><input type="number" step="0.1" value={panturrilhaEsquerda} onChange={e => setPanturrilhaEsquerda(e.target.value)} /></div></div>
                    <hr/>
                    <label>Foto de Progresso (opcional)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    <button type="submit">Salvar Registro</button>
                </form>
            </Modal>
        </div>
    );
};

export default ProgressoPage;