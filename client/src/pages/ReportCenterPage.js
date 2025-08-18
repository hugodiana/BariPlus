import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import './ReportCenterPage.css';

const ReportCenterPage = () => {
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');

    const generateReportLink = async (type) => {
        setLoading(true);
        setGeneratedLink('');
        try {
            // CORREÇÃO APLICADA AQUI
            const data = await fetchApi('/api/reports/generate', {
                method: 'POST',
                body: JSON.stringify({ type })
            });
            setGeneratedLink(data.shareableLink);
            toast.success('Link gerado com sucesso!');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        toast.info('Link copiado para a área de transferência!');
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Central de Relatórios</h1>
                <p>Gere links seguros e compartilháveis dos seus relatórios para a sua equipe médica.</p>
            </header>

            <div className="report-generator-grid">
                <Card className="report-option-card">
                    <div className="report-option-icon">📊</div>
                    <h3>Relatório de Progresso</h3>
                    <p>Cria um relatório completo com o seu histórico de peso e medidas.</p>
                    <button className="primary-btn" onClick={() => generateReportLink('progresso')} disabled={loading}>
                        {loading ? 'Gerando...' : 'Gerar Link de Progresso'}
                    </button>
                </Card>
                <Card className="report-option-card">
                    <div className="report-option-icon">⚕️</div>
                    <h3>Relatório de Exames</h3>
                    <p>Cria um relatório com todo o seu histórico de exames laboratoriais.</p>
                    <button className="primary-btn" onClick={() => generateReportLink('exames')} disabled={loading}>
                        {loading ? 'Gerando...' : 'Gerar Link de Exames'}
                    </button>
                </Card>
            </div>

            {generatedLink && (
                <Card className="generated-link-card">
                    <h3>Link Gerado com Sucesso!</h3>
                    {/* ✅ TEXTO CORRIGIDO */}
                    <p>Compartilhe este link com a sua equipe. Ele será válido por 30 dias.</p>
                    <div className="link-container">
                        <input type="text" value={generatedLink} readOnly />
                        <button onClick={copyToClipboard}>Copiar</button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ReportCenterPage;