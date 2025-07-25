import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './ProgressoPage.css';
import Modal from '../components/Modal';
import Card from '../components/ui/Card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ProgressoPage = () => {
    // ✅ Voltando aos estados separados, que são mais fáceis de gerir
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [novoPeso, setNovoPeso] = useState('');
    const [cintura, setCintura] = useState('');
    const [quadril, setQuadril] = useState('');
    const [braco, setBraco] = useState('');
    const [foto, setFoto] = useState(null);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchHistorico = useCallback(async () => {
        setLoading(true);
        try {
            // ✅ Usando a nossa chamada fetch padrão
            const response = await fetch(`${apiUrl}/api/pesos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setHistorico(data.sort((a, b) => new Date(a.data) - new Date(b.data)));
        } catch (error) {
            toast.error("Erro ao carregar histórico de progresso.");
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchHistorico();
    }, [fetchHistorico]);

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
            // ✅ Usando a nossa chamada fetch padrão
            await fetch(`${apiUrl}/api/pesos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            
            toast.success('Progresso registrado com sucesso!');
            setIsModalOpen(false);
            setNovoPeso(''); setCintura(''); setQuadril(''); setBraco(''); setFoto(null);
            fetchHistorico();
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

    if (loading) {
        return <div className="page-container">Carregando...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Meu Progresso</h1>
                <p>Acompanhe sua evolução de peso, medidas e fotos.</p>
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