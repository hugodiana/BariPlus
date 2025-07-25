import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import './AffiliatePortalPage.css';
import LoadingSpinner from '../components/LoadingSpinner'; // Nosso componente padrão
import Card from '../components/ui/Card'; // Nosso componente de Card
import { formatDate, formatCurrency } from '../utils/formatHelpers';

const AffiliatePortalPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchAffiliateStats = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/affiliate/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Não foi possível carregar os dados.");
            setStats(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchAffiliateStats();
    }, [fetchAffiliateStats]);

    const copyToClipboard = () => {
        if (!stats?.couponCode) return;
        navigator.clipboard.writeText(stats.couponCode)
            .then(() => {
                setCopied(true);
                toast.success('Cupom copiado!');
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => toast.error('Não foi possível copiar o cupom'));
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!stats) {
        return (
            <div className="page-container">
                <p>Não foi possível carregar seus dados de afiliado.</p>
            </div>
        );
    }

    // Calcula a comissão (30% do valor final)
    const commission = stats.totalRevenueInCents * 0.30;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Portal do Afiliado</h1>
                <p>Acompanhe aqui o desempenho do seu cupom de desconto.</p>
            </div>

            <div className="affiliate-stats-grid">
                <Card>
                    <h3>Seu Cupom de Desconto</h3>
                    <div className="coupon-container">
                        <span className="coupon-code">{stats.couponCode}</span>
                        <button onClick={copyToClipboard} className="copy-btn">
                            {copied ? '✓ Copiado' : 'Copiar'}
                        </button>
                    </div>
                </Card>
                <Card>
                    <h3>Vendas Realizadas</h3>
                    <p className="stat-number">{stats.salesCount}</p>
                </Card>
                <Card>
                    <h3>Seus Ganhos (30%)</h3>
                    <p className="stat-number">{formatCurrency(commission)}</p>
                </Card>
            </div>

            <Card>
                <h3>Detalhes das Vendas</h3>
                {stats.salesDetails && stats.salesDetails.length > 0 ? (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Cliente (Email)</th>
                                    <th>Valor da Venda</th>
                                    <th>Sua Comissão</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.salesDetails.map((sale, index) => (
                                    <tr key={index}>
                                        <td>{sale.customerEmail}</td>
                                        <td>{formatCurrency(sale.amount * 100)}</td>
                                        <td>{formatCurrency(sale.amount * 100 * 0.30)}</td>
                                        <td>{formatDate(sale.date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Ainda não há vendas registradas com o seu cupom.</p>
                )}
            </Card>
        </div>
    );
};

export default AffiliatePortalPage;