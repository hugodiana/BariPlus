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
  Filler,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

const WeightProgressCard = ({ 
  pesoInicial = 0, 
  pesoAtual = 0, 
  historico = [], 
  meta = null 
}) => {
  // Cálculos de progresso
  const diferenca = pesoInicial - pesoAtual;
  const pesoEliminado = Math.max(diferenca, 0).toFixed(1);
  const progressoMeta = meta ? Math.min(100, Math.max(0, ((pesoInicial - pesoAtual) / (pesoInicial - meta)) * 100) : null;

  // Determina a tendência (melhorada para lidar com casos de igualdade)
  const getTendencia = () => {
    if (historico.length < 2) return '';
    const ultimo = historico[historico.length - 1].peso;
    const penultimo = historico[historico.length - 2].peso;
    
    if (ultimo < penultimo) return '↓';
    if (ultimo > penultimo) return '↑';
    return '→';
  };

  // Prepara dados para o gráfico
  const getChartData = () => {
    const ultimosRegistros = historico.slice(-7);
    const hasEnoughData = historico.length > 1;
    
    return {
      labels: hasEnoughData 
        ? ultimosRegistros.map(item => new Date(item.data).toLocaleDateString('pt-BR', { 
            day: 'numeric', 
            month: 'short' 
          }))
        : [],
      datasets: [{
        label: 'Peso (kg)',
        data: hasEnoughData ? ultimosRegistros.map(item => item.peso) : [],
        borderColor: '#37715b',
        backgroundColor: 'rgba(55, 113, 91, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#37715b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#2c3e50',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        bodySpacing: 5,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `${context.parsed.y} kg`,
          title: (context) => context[0].label
        }
      }
    },
    scales: {
      x: {
        display: historico.length > 1,
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 10
          },
          color: '#7f8c8d'
        }
      },
      y: {
        display: false,
        min: Math.min(...historico.map(h => h.peso)) - 2,
        max: Math.max(...historico.map(h => h.peso)) + 2,
        grid: { display: false }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      line: {
        borderJoinStyle: 'round'
      }
    }
  };

  return (
    <div className="weight-card" aria-label="Cartão de progresso de peso">
      <header className="weight-card-header">
        <h3>Progresso de Peso</h3>
        {meta && (
          <div className="meta-indicator" aria-label={`Meta de peso: ${meta} kg`}>
            <span>Meta: {meta} kg</span>
          </div>
        )}
      </header>

      <div className="weight-stats">
        <div className="stat-item">
          <span className="stat-label">Inicial</span>
          <span className="stat-value">{pesoInicial.toFixed(1)} kg</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Atual</span>
          <span className="stat-value" aria-live="polite">
            {pesoAtual.toFixed(1)} kg
            {historico.length > 1 && (
              <span className="trend-indicator" aria-label={`Tendência: ${getTendencia() === '↓' ? 'diminuição' : getTendencia() === '↑' ? 'aumento' : 'estável'}`}>
                {getTendencia()}
              </span>
            )}
          </span>
        </div>
        <div className="stat-item eliminado">
          <span className="stat-label">Redução</span>
          <span className="stat-value">
            {pesoEliminado} kg
            {progressoMeta !== null && (
              <span className="progress-badge" aria-label={`Progresso em relação à meta: ${Math.round(progressoMeta)}%`}>
                {Math.round(progressoMeta)}%
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
              role="img"
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

WeightProgressCard.defaultProps = {
  pesoInicial: 0,
  pesoAtual: 0,
  historico: []
};

export default WeightProgressCard;