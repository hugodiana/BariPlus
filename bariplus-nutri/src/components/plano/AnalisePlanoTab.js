// src/components/plano/AnalisePlanoTab.js
import React, { useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2'; // ✅ Trocamos o segundo gráfico para Barras para melhor visualização
// ✅ 1. IMPORTAR TUDO O QUE É NECESSÁRIO DO CHART.JS
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import './AnalisePlanoTab.css';

// ✅ 2. REGISTAR TODOS OS COMPONENTES DO GRÁFICO
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);


const AnalisePlanoTab = ({ refeicoes, metas }) => {
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

    const macroChartData = {
        labels: ['Proteínas', 'Carboidratos', 'Gorduras'],
        datasets: [{
            data: [
                totais.protein * 4,
                totais.carbs * 4,
                totais.fats * 9
            ],
            backgroundColor: ['#37715b', '#007aff', '#f39c12'],
            hoverOffset: 4
        }]
    };
    
    // ✅ DADOS E OPÇÕES MELHORADOS PARA O GRÁFICO DE BARRAS
    const metasChartData = {
        labels: ['Proteínas (%)', 'Carboidratos (%)', 'Gorduras (%)'],
        datasets: [{
            label: 'Plano Atual (%)',
            data: [
                (totais.protein * 4 * 100) / totais.kcal || 0,
                (totais.carbs * 4 * 100) / totais.kcal || 0,
                (totais.fats * 9 * 100) / totais.kcal || 0
            ],
            backgroundColor: 'rgba(55, 113, 91, 0.7)',
        }, {
            label: 'Meta Definida (%)',
            data: [
                metas.proteinas_percent,
                metas.carboidratos_percent,
                metas.gorduras_percent
            ],
            backgroundColor: 'rgba(200, 200, 200, 0.7)',
        }]
    };
    
    const metasChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100 } }
    };

    return (
        <div className="analise-container">
            <div className="analise-grid">
                <div className="analise-card">
                    <h4>Distribuição Calórica (Macros)</h4>
                    <div className="chart-wrapper">
                        <Doughnut data={macroChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="analise-card">
                    <h4>Comparativo de Metas (%)</h4>
                    <div className="chart-wrapper">
                        <Bar data={metasChartData} options={metasChartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalisePlanoTab;