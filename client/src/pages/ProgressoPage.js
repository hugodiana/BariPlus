import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './ProgressoPage.css';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ProgressoPage = () => {
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estados para o novo formulário
    const [novoPeso, setNovoPeso] = useState('');
    const [cintura, setCintura] = useState('');
    const [anca, setAnca] = useState('');
    const [braco, setBraco] = useState('');
    const [foto, setFoto] = useState(null);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchHistorico = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/pesos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setHistorico(data.sort((a, b) => new Date(a.data) - new Date(b.data)));
        } catch (error) {
            console.error("Erro ao buscar histórico de peso:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistorico();
    }, []);

    const handleFileChange = (e) => {
        setFoto(e.target.files[0]);
    };

    const handleSubmitProgresso = async (e) => {
        e.preventDefault();
        
        // NOVIDADE: Usando FormData para enviar texto e arquivo
        const formData = new FormData();
        formData.append('peso', novoPeso);
        formData.append('cintura', cintura);
        formData.append('anca', anca);
        formData.append('braco', braco);
        if (foto) {
            formData.append('foto', foto);
        }

        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/api/pesos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // Sem 'Content-Type', o navegador define automaticamente para FormData
                body: formData,
            });

            if (!response.ok) throw new Error("Falha ao registrar progresso.");
            
            // Limpa o formulário e recarrega os dados
            setNovoPeso(''); setCintura(''); setAnca(''); setBraco(''); setFoto(null);
            setIsModalOpen(false);
            fetchHistorico(); // Recarrega o histórico para mostrar o novo item
        } catch (error) {
            console.error(error);
        }
    };

    // ... (lógica do chartData e chartOptions continua igual)

    if (loading) return <div>Carregando seu progresso...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Meu Progresso</h1>
                <p>Visualize sua evolução de peso, medidas e fotos.</p>
            </div>

            <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ Adicionar Novo Registro</button>

            <div className="progresso-card chart-card">
                <Line options={chartOptions} data={chartData} />
            </div>

            {/* NOVIDADE: Galeria de Fotos */}
            <div className="progresso-card">
                <h3>Galeria de Fotos da Evolução</h3>
                <div className="photo-gallery">
                    {historico.filter(item => item.fotoUrl).map(item => (
                        <div key={item._id} className="photo-item">
                            <a href={item.fotoUrl} target="_blank" rel="noopener noreferrer">
                                <img src={item.fotoUrl} alt={`Progresso em ${format(new Date(item.data), 'dd/MM/yyyy')}`} />
                            </a>
                            <time>{format(new Date(item.data), 'dd/MM/yyyy')}</time>
                        </div>
                    ))}
                </div>
            </div>

            <div className="progresso-card table-card">
                <h3>Histórico de Registros</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Peso (kg)</th>
                            <th>Cintura (cm)</th>
                            <th>Anca (cm)</th>
                            <th>Braço (cm)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historico.slice(0).reverse().map(item => (
                            <tr key={item._id}>
                                <td>{format(new Date(item.data), 'dd/MM/yyyy')}</td>
                                <td>{item.peso.toFixed(1)}</td>
                                <td>{item.medidas?.cintura || '-'}</td>
                                <td>{item.medidas?.anca || '-'}</td>
                                <td>{item.medidas?.braco || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Novo Registro de Progresso</h2>
                <form onSubmit={handleSubmitProgresso}>
                    <label>Peso (kg) *</label>
                    <input type="number" step="0.1" value={novoPeso} onChange={e => setNovoPeso(e.target.value)} required />
                    
                    <label>Medida da Cintura (cm)</label>
                    <input type="number" step="0.1" value={cintura} onChange={e => setCintura(e.target.value)} />
                    
                    <label>Medida da Anca (cm)</label>
                    <input type="number" step="0.1" value={anca} onChange={e => setAnca(e.target.value)} />
                    
                    <label>Medida do Braço (cm)</label>
                    <input type="number" step="0.1" value={braco} onChange={e => setBraco(e.target.value)} />

                    <label>Foto de Progresso (opcional)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />

                    <button type="submit">Salvar Progresso</button>
                </form>
            </Modal>
        </div>
    );
};

export default ProgressoPage;