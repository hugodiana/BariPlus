// src/pages/DocumentosPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './DocumentosPage.css'; // Criaremos a seguir

const DocumentosPage = () => {
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDocumentos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/documentos'); // A nova rota que criámos para o paciente
            setDocumentos(data);
        } catch (error) {
            toast.error("Erro ao carregar os seus documentos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocumentos();
    }, [fetchDocumentos]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Meus Documentos</h1>
                <p>Aqui encontra todos os laudos, atestados e pedidos de exame compartilhados pelo seu nutricionista.</p>
            </div>

            <Card>
                {documentos.length > 0 ? (
                    <ul className="documentos-list-paciente">
                        {documentos.map(doc => (
                            <li key={doc._id}>
                                <div className="doc-info">
                                    <strong>{doc.nome}</strong>
                                    <span>{doc.categoria} • Compartilhado em {format(new Date(doc.dataUpload), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                </div>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="download-btn">
                                    Baixar
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        title="Nenhum Documento Compartilhado"
                        message="O seu nutricionista ainda não compartilhou nenhum documento consigo. Assim que ele o fizer, aparecerão aqui."
                    />
                )}
            </Card>
        </div>
    );
};

export default DocumentosPage;