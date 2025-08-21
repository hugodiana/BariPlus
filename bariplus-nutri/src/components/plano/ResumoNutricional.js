// src/components/plano/ResumoNutricional.js
import React, { useMemo } from 'react';
import './ResumoNutricional.css';

const ProgressBar = ({ value, goal }) => {
    const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
    return (
        <div className="macro-progress-bar">
            <div className="macro-progress-fill" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const ResumoNutricional = ({ refeicoes, metas }) => {
    const totais = useMemo(() => {
        let kcal = 0, protein = 0, carbs = 0, fats = 0;
        refeicoes.forEach(refeicao => {
            refeicao.itens.forEach(item => {
                const ratio = (item.porcao || 100) / 100;
                kcal += (item.base_kcal || 0) * ratio;
                protein += (item.base_protein || 0) * ratio;
                carbs += (item.base_carbs || 0) * ratio;
                fats += (item.base_fats || 0) * ratio;
            });
        });
        return { kcal, protein, carbs, fats };
    }, [refeicoes]);

    const metaProteinaG = (metas.vet * (metas.proteinas_percent / 100)) / 4;
    const metaCarbsG = (metas.vet * (metas.carboidratos_percent / 100)) / 4;
    const metaFatsG = (metas.vet * (metas.gorduras_percent / 100)) / 9;

    return (
        <div className="resumo-nutricional-card">
            <h4>Resumo do Plano</h4>
            <div className="resumo-item-principal">
                <span className="valor-principal">{totais.kcal.toFixed(0)}</span>
                <span className="meta-principal">/ {metas.vet} Kcal</span>
                <ProgressBar value={totais.kcal} goal={metas.vet} />
            </div>
            <div className="resumo-macros">
                <div className="macro-item">
                    <div className="macro-info"><span>Proteínas</span><span>{totais.protein.toFixed(1)}g / {metaProteinaG.toFixed(1)}g</span></div>
                    <ProgressBar value={totais.protein} goal={metaProteinaG} />
                </div>
                <div className="macro-item">
                    <div className="macro-info"><span>Carboidratos</span><span>{totais.carbs.toFixed(1)}g / {metaCarbsG.toFixed(1)}g</span></div>
                    <ProgressBar value={totais.carbs} goal={metaCarbsG} />
                </div>
                 <div className="macro-item">
                    <div className="macro-info"><span>Gorduras</span><span>{totais.fats.toFixed(1)}g / {metaFatsG.toFixed(1)}g</span></div>
                    <ProgressBar value={totais.fats} goal={metaFatsG} />
                </div>
            </div>
        </div>
    );
};

export default ResumoNutricional;