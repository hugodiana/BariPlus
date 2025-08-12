import React from 'react';
import './WeightProgressCard.css';
import Card from '../ui/Card';

const WeightProgressCard = ({ usuario }) => {
    // Extrai os dados do objeto do usuário para maior clareza
    const pesoInicial = usuario?.detalhesCirurgia?.pesoInicial || 0;
    const pesoAtual = usuario?.detalhesCirurgia?.pesoAtual || 0;
    const metaPeso = usuario?.metaPeso || 0;

    const pesoEliminado = pesoInicial - pesoAtual;
    const faltamParaMeta = pesoAtual - metaPeso;

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
                {/* ✅ NOVO: Bloco para a meta */}
                {metaPeso > 0 && (
                    <div className="stat-item meta">
                        <span className="stat-label">Meta</span>
                        <span className="stat-value">{metaPeso.toFixed(1)} kg</span>
                    </div>
                )}
            </div>
            {/* ✅ NOVO: Barra de progresso para a meta */}
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