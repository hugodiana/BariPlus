import React from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const WeightProgressCard = ({ 
  pesoInicial = 0, 
  pesoAtual = 0, 
  historico = [], 
  meta = null 
}) => {
  const diferenca = pesoInicial - pesoAtual;
  const pesoEliminado = Math.max(diferenca, 0).toFixed(1);
  
  // ✅ CORREÇÃO: Parêntese adicionado para corrigir a sintaxe
  const progressoMeta = meta ? ((pesoInicial - pesoAtual) / (pesoInicial - meta)) * 100 : null;

  const getChartData = () => {
    const ultimosRegistros = historico.slice(-7);
    return {
      labels: ultimosRegistros.map(item => new Date(item.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })),
      datasets: [{
        label: 'Peso (kg)',
        data: ultimosRegistros.map(item => item.peso),
        borderColor: '#007aff',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#007aff'
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => `${context.parsed.y} kg` } }
    },
    scales: {
      x: {
        display: historico.length > 1,
        grid: { display: false },
        ticks: { maxRotation: 0, minRotation: 0, font: { size: 10 } }
      },
      y: {
        display: false,
        min: historico.length > 0 ? Math.min(...historico.map(h => h.peso)) - 2 : undefined,
        max: historico.length > 0 ? Math.max(...historico.map(h => h.peso)) + 2 : undefined,
        grid: { display: false }
      }
    },
    interaction: { intersect: false, mode: 'index' }
  };

  return (
    <div className="dashboard-card weight-card">
      <header className="weight-card-header">
        <h3>Progresso de Peso</h3>
        {meta && (
          <div className="meta-indicator">
            <span>Meta: {meta} kg</span>
          </div>
        )}
      </header>

      <div className="weight-stats">
        <div className="stat-item">
          <span className="stat-label">Inicial</span>
          <span className="stat-value">{pesoInicial} kg</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Atual</span>
          <span className="stat-value" aria-live="polite">
            {pesoAtual} kg
            {historico.length > 0 && (
              <span className="trend-indicator">
                {diferenca > 0 ? '↓' : diferenca < 0 ? '↑' : '→'}
              </span>
            )}
          </span>
        </div>
        <div className="stat-item eliminado">
          <span className="stat-label">Redução</span>
          <span className="stat-value">
            {pesoEliminado} kg
            {progressoMeta !== null && (
              <span className="progress-badge">
                {Math.min(100, Math.round(progressoMeta))}%
              </span>
            )}
          </span>
        </div>
      </div>
      
      <div className="chart-container">
        {historico.length > 1 ? (
          <>
            <Line 
              data={getChartData()} 
              options={chartOptions} 
              aria-label="Gráfico de evolução de peso"
            />
            <div className="chart-legend">
              <span>Últimos 7 registros</span>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Adicione pelo menos 2 registros para visualizar o gráfico</p>
            <small>Seu progresso será exibido aqui</small>
          </div>
        )}
      </div>
    </div>
  );
};

WeightProgressCard.propTypes = {
  pesoInicial: PropTypes.number,
  pesoAtual: PropTypes.number,
  historico: PropTypes.arrayOf(
    PropTypes.shape({
      data: PropTypes.string.isRequired,
      peso: PropTypes.number.isRequired
    })
  ),
  meta: PropTypes.number
};

export default WeightProgressCard;