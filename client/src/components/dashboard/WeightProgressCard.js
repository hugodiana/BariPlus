import React from 'react';
import './WeightProgressCard.css';

// Este componente recebe os dados de peso como "props"
const WeightProgressCard = ({ pesoInicial, pesoAtual }) => {
  const pesoEliminado = (pesoInicial - pesoAtual).toFixed(1);

  return (
    <div className="dashboard-card weight-card">
      <h3>Progresso de Peso</h3>
      <div className="weight-stats">
        <div className="stat-item">
          <span className="stat-label">Inicial</span>
          <span className="stat-value">{pesoInicial} kg</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Atual</span>
          <span className="stat-value">{pesoAtual} kg</span>
        </div>
        <div className="stat-item eliminado">
          <span className="stat-label">Eliminado</span>
          <span className="stat-value">{pesoEliminado} kg</span>
        </div>
      </div>
    </div>
  );
};

export default WeightProgressCard;