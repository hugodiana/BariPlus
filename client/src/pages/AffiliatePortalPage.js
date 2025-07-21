import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import './AffiliatePortalPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate, formatCurrency } from '../utils/formatHelpers';

const AffiliatePortalPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('sales');
    const [copied, setCopied] = useState(false);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchAffiliateStats = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/affiliate/stats`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Não foi possível carregar os dados.");
                }
                
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                setError(error.message);
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAffiliateStats();
    }, [token, apiUrl]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(stats.couponCode)
            .then(() => {
                setCopied(true);
                toast.success('Cupom copiado!');
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => toast.error('Não foi possível copiar o cupom'));
    };

    if (loading) {
        return (
            <div className="page-container">
                <LoadingSpinner message="Carregando portal do afiliado..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <EmptyState 
                    title="Erro ao carregar dados"
                    message={error}
                    actionText="Tentar novamente"
                    onAction={() => window.location.reload()}
                />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="page-container">
                <EmptyState 
                    title="Nenhum dado encontrado"
                    message="Você ainda não possui dados de afiliado."
                />
            </div>
        );
    }

    return (
        <div className="affiliate-portal-container">
            <div className="portal-header">
                <h1>Portal do Afiliado</h1>
                <p className="subtitle">Acompanhe o desempenho do seu cupom de desconto</p>
            </div>

            <div className="stats-summary">
                <div className="stat-card highlight">
                    <h3>Seu Cupom</h3>
                    <div className="coupon-container">
                        <span className="coupon-code">{stats.couponCode}</span>
                        <button 
                            onClick={copyToClipboard}
                            className={`copy-btn ${copied ? 'copied' : ''}`}
                            aria-label="Copiar cupom"
                        >
                            {copied ? '✓' : 'Copiar'}
                        </button>
                    </div>
                    <p className="stat-description">Compartilhe este cupom para ganhar comissões</p>
                </div>

                <div className="stat-card">
                    <h3>Vendas Realizadas</h3>
                    <p className="stat-value">{stats.salesCount}</p>
                    <p className="stat-description">Total de vendas com seu cupom</p>
                </div>

                <div className="stat-card">
                    <h3>Receita Gerada</h3>
                    <p className="stat-value">{formatCurrency(stats.totalRevenueInCents / 100)}</p>
                    <p className="stat-description">Total em comissões</p>
                </div>
            </div>

            <div className="portal-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    Vendas
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('performance')}
                >
                    Desempenho
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'sales' ? (
                    <div className="sales-table-container">
                        <h3>Histórico de Vendas</h3>
                        {stats.salesDetails?.length > 0 ? (
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Cliente</th>
                                            <th>Valor</th>
                                            <th>Comissão</th>
                                            <th>Data</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.salesDetails.map((sale, index) => (
                                            <tr key={`sale-${index}`}>
                                                <td>{sale.customerEmail}</td>
                                                <td>{formatCurrency(sale.amount)}</td>
                                                <td>{formatCurrency(sale.commission)}</td>
                                                <td>{formatDate(sale.date)}</td>
                                                <td>
                                                    <span className={`status-badge ${sale.status}`}>
                                                        {sale.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState 
                                title="Nenhuma venda encontrada"
                                message="Quando você realizar vendas com seu cupom, elas aparecerão aqui."
                                icon="📊"
                            />
                        )}
                    </div>
                ) : (
                    <div className="performance-container">
                        <h3>Métricas de Desempenho</h3>
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <h4>Taxa de Conversão</h4>
                                <p className="metric-value">{stats.conversionRate || '0%'}</p>
                            </div>
                            <div className="metric-card">
                                <h4>Clientes Recorrentes</h4>
                                <p className="metric-value">{stats.recurringCustomers || 0}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

AffiliatePortalPage.propTypes = {
    // Adicione PropTypes se necessário
};

export default AffiliatePortalPage;