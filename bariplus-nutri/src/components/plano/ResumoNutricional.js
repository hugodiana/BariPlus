// src/components/plano/ResumoNutricional.js
import React, { useMemo } from 'react';
import './ResumoNutricional.css';

const ResumoNutricional = ({ refeicoes }) => {
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

    return (
        <div className="resumo-nutricional-card">
            <h4>Resumo do Plano</h4>
            <div className="resumo-grid">
                <div className="resumo-item"><span>{totais.kcal.toFixed(0)}</span><label>Kcal</label></div>
                <div className="resumo-item"><span>{totais.protein.toFixed(1)}g</span><label>Proteínas</label></div>
                <div className="resumo-item"><span>{totais.carbs.toFixed(1)}g</span><label>Carboidratos</label></div>
                <div className="resumo-item"><span>{totais.fats.toFixed(1)}g</span><label>Gorduras</label></div>
            </div>
        </div>
    );
};

export default ResumoNutricional;