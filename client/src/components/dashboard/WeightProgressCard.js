import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { format } from 'date-fns';
import Card from '../ui/Card';
import './WeightProgressCard.css';

// Registrando os componentes necessários do Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const WeightProgressCard = ({ usuario, historicoPesos = [] }) => {
    const pesoInicial = usuario?.detalhesCirurgia?.pesoInicial || 0;
    const pesoAtual = usuario?.detalhesCirurgia?.pesoAtual || 0;
    const metaPeso = usuario?.metaPeso || 0;

    const pesoEliminado = pesoInicial - pesoAtual;
    const faltamParaMeta = pesoAtual - metaPeso;

    // Pega os últimos 7 registros para um gráfico limpo
    const ultimosRegistros = historicoPesos.slice(-7);

    const chartData = {
        labels: ultimosRegistros.map(p => format(new Date(p.data), 'dd/MM')),
        datasets: [
            {
                label: 'Peso (kg)',
                data: ultimosRegistros.map(p => p.peso),
                fill: true,
                backgroundColor: 'rgba(55, 113, 91, 0.2)',
                borderColor: 'rgba(55, 113, 91, 1)',
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: 'rgba(55, 113, 91, 1)',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    font: {
                        size: 10
                    }
                }
            },
            y: {
                beginAtZero: false,
                ticks: {
                    font: {
                        size: 10
                    }
                }
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Peso: ${context.parsed.y} kg`;
                    }
                }
            }
        },
    };

    return (
        <Card className="dashboard-card weight-card">
            <h3>Progresso de Peso</h3>
            <div className="weight-stats">
                <div className="stat-item">
                    <span className="stat-label">Inicial</span>
                    <span className="stat-value">{pesoInicial.toFixed(1)} kg</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Atual</span>
                    <span className="stat-value">{pesoAtual.toFixed(1)} kg</span>
                </div>
                <div className="stat-item eliminado">
                    <span className="stat-label">Eliminado</span>
                    <span className="stat-value">{pesoEliminado >= 0 ? pesoEliminado.toFixed(1) : 0} kg</span>
                </div>
                {metaPeso > 0 && (
                    <div className="stat-item meta">
                        <span className="stat-label">Meta</span>
                        <span className="stat-value">{metaPeso.toFixed(1)} kg</span>
                    </div>
                )}
            </div>
            
            {ultimosRegistros.length > 1 && (
                <div className="chart-container">
                    <Line options={chartOptions} data={chartData} />
                </div>
            )}

            {metaPeso > 0 && pesoInicial > metaPeso && (
                 <div className="goal-progress-container">
                    <div className="goal-progress-info">
                        <span>Rumo à meta!</span>
                        <span>Faltam <strong>{faltamParaMeta > 0 ? faltamParaMeta.toFixed(1) : 0} kg</strong></span>
                    </div>
                    <div className="progress-bar-background">
                        <div 
                            className="progress-bar-foreground" 
                            style={{ width: `${Math.max(0, 100 - (faltamParaMeta / (pesoInicial - metaPeso)) * 100)}%`}}
                        ></div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default WeightProgressCard;