import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './AffiliatePortalPage.css';

const AffiliatePortalPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchAffiliateStats = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/affiliate/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Não foi possível carregar os dados.");
                }
                setStats(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAffiliateStats();
    }, [token, apiUrl]);

    if (loading) {
        return <div className="page-container">Carregando portal do afiliado...</div>;
    }

    if (!stats) {
        return <div className="page-container">Não foi possível carregar os dados do afiliado.</div>;
    }

    const totalRevenue = (stats.totalRevenueInCents / 100).toFixed(2);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Portal do Afiliado</h1>
                <p>Acompanhe aqui o desempenho do seu cupom de desconto.</p>
            </div>

            <div className="affiliate-stats-grid">
                <div className="affiliate-stat-card">
                    <h3>Seu Cupom</h3>
                    <p className="coupon-code">{stats.couponCode}</p>
                </div>
                <div className="affiliate-stat-card">
                    <h3>Vendas Realizadas</h3>
                    <p className="stat-number">{stats.salesCount}</p>
                </div>
                <div className="affiliate-stat-card">
                    <h3>Receita Gerada</h3>
                    <p className="stat-number">R$ {totalRevenue}</p>
                </div>
            </div>

            <div className="sales-table-container">
                <h3>Detalhes das Vendas</h3>
                {stats.salesDetails && stats.salesDetails.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Valor Pago</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.salesDetails.map((sale, index) => (
                                <tr key={index}>
                                    <td>{sale.customerEmail}</td>
                                    <td>R$ {sale.amount}</td>
                                    <td>{sale.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Ainda não há vendas registradas com o seu cupom.</p>
                )}
            </div>
        </div>
    );
};

export default AffiliatePortalPage;