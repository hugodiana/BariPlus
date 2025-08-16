import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/ui/Card';
import './PublicReportPage.css';

// Componentes internos para renderizar os dados
const ProgressReportView = ({ data }) => (
    <div className="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Peso (kg)</th>
                    <th>Cintura (cm)</th>
                    <th>Quadril (cm)</th>
                </tr>
            </thead>
            <tbody>
                {data.sort((a, b) => new Date(b.data) - new Date(a.data)).map(item => (
                    <tr key={item._id}>
                        <td>{format(parseISO(item.data), 'dd/MM/yyyy')}</td>
                        <td>{item.peso?.toFixed(1) || '-'}</td>
                        <td>{item.medidas?.cintura || '-'}</td>
                        <td>{item.medidas?.quadril || '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ExamsReportView = ({ data }) => (
    <div className="exams-list">
        {data.map(exam => (
            <div key={exam._id} className="exam-group">
                <h4>{exam.name} ({exam.unit})</h4>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Valor</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exam.history.sort((a,b) => new Date(b.date) - new Date(a.date)).map(result => (
                                <tr key={result._id}>
                                    <td>{format(parseISO(result.date), 'dd/MM/yyyy')}</td>
                                    <td>{result.value}</td>
                                    <td>{result.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        ))}
    </div>
);


const PublicReportPage = () => {
    const { token } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReport = useCallback(async () => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL;
            const res = await fetch(`${apiUrl}/api/public/report/${token}`);
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Relatório inválido.');
            }
            const data = await res.json();
            setReport(data);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    if (loading) return <LoadingSpinner fullPage />;

    return (
        <div className="public-report-background">
            <div className="public-report-container">
                <header className="public-report-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" />
                </header>
                <Card>
                    {error ? (
                        <div className="report-error">
                            <h2>Erro ao Carregar</h2>
                            <p>{error}</p>
                        </div>
                    ) : report && (
                        <div className="report-content">
                            <h1>Relatório de {report.type === 'progresso' ? 'Progresso' : 'Exames'}</h1>
                            <div className="report-meta">
                                <span><strong>Paciente:</strong> {report.userName}</span>
                                <span><strong>Gerado em:</strong> {format(parseISO(report.createdAt), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}</span>
                            </div>
                            
                            {report.type === 'progresso' && <ProgressReportView data={report.data} />}
                            {report.type === 'exames' && <ExamsReportView data={report.data} />}
                        </div>
                    )}
                </Card>
                 <footer className="public-report-footer">
                    <p>Relatório gerado com a plataforma BariPlus</p>
                </footer>
            </div>
        </div>
    );
};

export default PublicReportPage;