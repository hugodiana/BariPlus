import React from 'react';
import './WeightProgressCard.css';
// Não precisamos mais de 'react-chartjs-2' aqui

const WeightProgressCard = ({ pesoInicial = 0, pesoAtual = 0 }) => {
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
          <span className="stat-value">{pesoEliminado >= 0 ? pesoEliminado : 0} kg</span>
        </div>
      </div>
    </div>
  );
};

export default WeightProgressCard;