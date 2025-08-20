// src/components/charts/GrowthChartCard.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import Card from '../ui/Card';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const formatChartData = (userGrowth = [], nutriGrowth = []) => {
    const labels = [];
    const monthlyData = {};

    // Gera os labels dos últimos 6 meses
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.toLocaleString('pt-BR', { month: 'short' });
        const year = d.getFullYear().toString().slice(-2);
        const label = `${month}/${year}`;
        labels.push(label);
        monthlyData[label] = { users: 0, nutris: 0 };
    }

    userGrowth.forEach(item => {
        const d = new Date(item._id.year, item._id.month - 1);
        const label = `${d.toLocaleString('pt-BR', { month: 'short' })}/${d.getFullYear().toString().slice(-2)}`;
        if (monthlyData[label]) monthlyData[label].users = item.count;
    });

    nutriGrowth.forEach(item => {
        const d = new Date(item._id.year, item._id.month - 1);
        const label = `${d.toLocaleString('pt-BR', { month: 'short' })}/${d.getFullYear().toString().slice(-2)}`;
        if (monthlyData[label]) monthlyData[label].nutris = item.count;
    });

    return {
        labels,
        datasets: [
            {
                label: 'Novos Pacientes',
                data: labels.map(l => monthlyData[l].users),
                borderColor: '#37715b',
                backgroundColor: 'rgba(55, 113, 91, 0.2)',
                fill: true,
                tension: 0.3
            },
            {
                label: 'Novos Nutricionistas',
                data: labels.map(l => monthlyData[l].nutris),
                borderColor: '#007aff',
                backgroundColor: 'rgba(0, 122, 255, 0.2)',
                fill: true,
                tension: 0.3
            }
        ]
    };
};

const GrowthChartCard = ({ data }) => {
    const chartData = formatChartData(data?.userGrowth, data?.nutriGrowth);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Novos Registos nos Últimos 6 Meses' }
        },
        scales: { y: { beginAtZero: true } }
    };

    return (
        <Card className="chart-card">
            <div className="chart-container">
                <Line options={options} data={chartData} />
            </div>
        </Card>
    );
};

export default GrowthChartCard;