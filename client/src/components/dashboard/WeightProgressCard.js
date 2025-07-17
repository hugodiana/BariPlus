import React from 'react';
import './WeightProgressCard.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler // Importe o Filler para a cor de fundo
} from 'chart.js';

// Registrando os componentes do Chart.js que vamos usar
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const WeightProgressCard = ({ pesoInicial, pesoAtual, historico }) => {
  // Garante que os valores nunca são nulos ou indefinidos para evitar erros
  const pInicial = pesoInicial || 0;
  const pAtual = pesoAtual || 0;
  const hist = historico || [];

  const pesoEliminado = (pInicial - pAtual).toFixed(1);

  // Prepara os últimos 7 registros para o gráfico
  const ultimosRegistros = hist.slice(-7);

  const chartData = {
    labels: ultimosRegistros.map(item => new Date(item.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })),
    datasets: [{
        label: 'Peso (kg)',
        data: ultimosRegistros.map(item => item.peso),
        borderColor: '#007aff',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0, // Esconde os pontos para um visual mais limpo
    }]
  };

  const chartOptions = {
    responsive: true,
    // Esta opção é crucial para o gráfico se ajustar ao contêiner
    maintainAspectRatio: false, 
    plugins: {
      legend: { display: false }, // Esconde a legenda
      tooltip: {
        enabled: true // Habilita tooltips ao passar o mouse
      }
    },
    scales: {
        x: { 
            display: false, // Esconde as labels do eixo X
            grid: { display: false }
        },
        y: { 
            display: false, // Esconde as labels do eixo Y
            grid: { display: false }
        }
    }
  };

  return (
    <div className="dashboard-card weight-card">
      <h3>Progresso de Peso</h3>
      <div className="weight-stats">
        <div className="stat-item">
          <span className="stat-label">Inicial</span>
          <span className="stat-value">{pInicial} kg</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Atual</span>
          <span className="stat-value">{pAtual} kg</span>
        </div>
        <div className="stat-item eliminado">
          <span className="stat-label">Eliminado</span>
          <span className="stat-value">{pesoEliminado >= 0 ? pesoEliminado : 0} kg</span>
        </div>
      </div>
      
      <div className="mini-chart-container">
        {hist && hist.length > 1 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="chart-placeholder">Adicione mais um registro de peso para ver sua evolução.</div>
        )}
      </div>
    </div>
  );
};

export default WeightProgressCard;