import React, { useState, useEffect, useCallback } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import './ProgressoPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import ProgressReport from '../components/PDFReport'; // Garanta que este componente existe
import LoadingSpinner from '../components/LoadingSpinner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ProgressoPage = () => {
    const [historico, setHistorico] = useState([]);
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [novoPeso, setNovoPeso] = useState('');
    const [cintura, setCintura] = useState('');
    const [quadril, setQuadril] = useState('');
    const [braco, setBraco] = useState('');
    const [foto, setFoto] = useState(null);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    // ✅ CORREÇÃO: Apenas UMA função para buscar todos os dados
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

    // ✅ CORREÇÃO: Apenas UM useEffect para chamar a função
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
        formData.append('braco', braco);
        if (foto) {
            formData.append('foto', foto);
        }

        try {
            await fetch(`${apiUrl}/api/pesos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            toast.success('Progresso registrado com sucesso!');
            setIsModalOpen(false);
            setNovoPeso(''); setCintura(''); setQuadril(''); setBraco(''); setFoto(null);
            fetchData(); // Recarrega todos os dados
        } catch (error) {
            toast.error('Erro ao salvar progresso.');
        }
    };

    const chartData = {
        labels: historico.map(item => format(new Date(item.data), 'dd/MM')),
        datasets: [{
            label: 'Peso (kg)',
            data: historico.map(item => item.peso),
            borderColor: 'var(--action-blue)',
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
            fill: true,
            tension: 0.3
        }]
    };
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Evolução de Peso' }
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header-actions">
                <div className="page-header">
                    <h1>Meu Progresso</h1>
                    <p>Visualize sua evolução de peso, medidas e fotos.</p>
                </div>
                {historico.length > 0 && usuario && (
                    <PDFDownloadLink
                        document={<ProgressReport usuario={usuario} historico={historico} />}
                        fileName={`Relatorio_Progresso_${usuario.nome}_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                        className="pdf-link"
                    >
                        {({ loading }) => (loading ? 'A gerar PDF...' : 'Exportar para PDF')}
                    </PDFDownloadLink>
                )}
            </div>

            <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Adicionar Novo Registro</button>

            {historico.length > 0 ? (
                <div className="progresso-content">
                    <Card className="chart-card">
                        <Line options={chartOptions} data={chartData} />
                    </Card>
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
                                        <th>Peso (kg)</th>
                                        <th>Cintura (cm)</th>
                                        <th>Quadril (cm)</th>
                                        <th>Braço (cm)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...historico].reverse().map(item => (
                                        <tr key={item._id}>
                                            <td>{format(new Date(item.data), 'dd/MM/yyyy')}</td>
                                            <td>{item.peso?.toFixed(1) || '-'}</td>
                                            <td>{item.medidas?.cintura || '-'}</td>
                                            <td>{item.medidas?.quadril || '-'}</td>
                                            <td>{item.medidas?.braco || '-'}</td>
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
                <h2>Novo Registro de Progresso</h2>
                <form onSubmit={handleSubmitProgresso} className="progresso-form">
                    <label>Peso (kg) *</label>
                    <input type="number" step="0.1" value={novoPeso} onChange={e => setNovoPeso(e.target.value)} required />
                    <label>Medida da Cintura (cm)</label>
                    <input type="number" step="0.1" value={cintura} onChange={e => setCintura(e.target.value)} />
                    <label>Medida do Quadril (cm)</label>
                    <input type="number" step="0.1" value={quadril} onChange={e => setQuadril(e.target.value)} />
                    <label>Medida do Braço (cm)</label>
                    <input type="number" step="0.1" value={braco} onChange={e => setBraco(e.target.value)} />
                    <label>Foto de Progresso (opcional)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    <button type="submit">Salvar Registro</button>
                </form>
            </Modal>
        </div>
    );
};

export default ProgressoPage;