import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './ProgressoPage.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ProgressoPage = () => {
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('bariplus_token');

    useEffect(() => {
        const fetchHistorico = async () => {
            try {
                // AQUI ESTÁ A MUDANÇA
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pesos`, {
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
        fetchHistorico();
    }, [token]);

    const chartData = { /* ... */ }; // A lógica do chart não muda
    const chartOptions = { /* ... */ }; // A lógica das opções não muda

    if (loading) return <div>Carregando seu progresso...</div>;

    // O return (JSX) também não muda
    return (
        <div className="progresso-container">
            <h1>Meu Progresso</h1>
            <div className="progresso-card chart-card">
                <Line options={chartOptions} data={chartData} />
            </div>
            <div className="progresso-card table-card">
                <h3>Histórico de Registros</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Peso (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historico.slice(0).reverse().map((item, index) => (
                            <tr key={index}>
                                <td>{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                                <td>{item.peso.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProgressoPage;