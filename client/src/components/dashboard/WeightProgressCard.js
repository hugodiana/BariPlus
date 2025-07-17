import React from 'react';
import './WeightProgressCard.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const WeightProgressCard = ({ pesoInicial, pesoAtual, historico }) => {
  const pesoEliminado = (pesoInicial && pesoAtual) ? (pesoInicial - pesoAtual).toFixed(1) : 0;

  // Prepara os últimos 7 registros para o gráfico
  const ultimosRegistros = historico ? historico.slice(-7) : [];

  const chartData = {
    labels: ultimosRegistros.map(item => new Date(item.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })),
    datasets: [{
        label: 'Peso (kg)',
        data: ultimosRegistros.map(item => item.peso),
        borderColor: '#007aff',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    // ✅ CORREÇÃO: Esta opção é crucial para o gráfico se ajustar ao contêiner
    maintainAspectRatio: false, 
    plugins: {
      legend: { display: false },
    },
    scales: {
        x: { display: false },
        y: { display: false }
    }
  };

  return (
    <div className="dashboard-card weight-card">
      <h3>Progresso de Peso</h3>
      <div className="weight-stats">
        <div className="stat-item">
          <span className="stat-label">Inicial</span>
          <span className="stat-value">{pesoInicial || 0} kg</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Atual</span>
          <span className="stat-value">{pesoAtual || 0} kg</span>
        </div>
        <div className="stat-item eliminado">
          <span className="stat-label">Eliminado</span>
          <span className="stat-value">{pesoEliminado >= 0 ? pesoEliminado : 0} kg</span>
        </div>
      </div>
      
      <div className="mini-chart-container">
        {historico && historico.length > 1 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="chart-placeholder">Adicione mais um registro de peso para ver sua evolução.</div>
        )}
      </div>
    </div>
  );
};

export default WeightProgressCard;