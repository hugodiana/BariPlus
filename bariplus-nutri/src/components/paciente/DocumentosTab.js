// src/components/paciente/DocumentosTab.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../../utils/api';
import Modal from '../Modal';
import ViewAtestadoModal from './ViewAtestadoModal';
import GerarDocumentoModal from './GerarDocumentoModal';
import '../../pages/ProntuarioPage.css';

const DocumentosTab = ({ paciente, nutricionista, prontuario, onUpdate }) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
    const [viewingAtestado, setViewingAtestado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [historicoAtestados, setHistoricoAtestados] = useState([]);
    
    const [formData, setFormData] = useState({
        nome: '', categoria: 'Laudos', ficheiro: null
    });

    const fetchHistoricoAtestados = useCallback(async () => {
        try {
            const data = await fetchApi(`/api/nutri/prontuarios/${paciente._id}/atestados`);
            setHistoricoAtestados(data);
        } catch (error) {
            toast.error("Erro ao carregar histórico de atestados.");
        }
    }, [paciente._id]);
    
    useEffect(() => {
        fetchHistoricoAtestados();
    }, [fetchHistoricoAtestados]);

    const handleFileChange = (e) => setFormData(prev => ({ ...prev, ficheiro: e.target.files[0] }));
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitUpload = async (e) => {
        e.preventDefault();
        if (!formData.ficheiro) return toast.warn("Por favor, selecione um ficheiro.");
        setLoading(true);
        const data = new FormData();
        data.append('documento', formData.ficheiro);
        data.append('nome', formData.nome || formData.ficheiro.name);
        data.append('categoria', formData.categoria);
        try {
            const token = localStorage.getItem('nutri_token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/nutri/prontuarios/${prontuario.pacienteId}/documentos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });
            const updatedProntuario = await response.json();
            if (!response.ok) throw new Error(updatedProntuario.message || 'Falha no upload.');
            onUpdate(updatedProntuario);
            setIsUploadModalOpen(false);
            toast.success("Documento carregado com sucesso!");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (docId) => {
        if (window.confirm("Tem a certeza que quer apagar este documento?")) {
            try {
                const updatedProntuario = await fetchApi(`/api/nutri/prontuarios/${prontuario.pacienteId}/documentos/${docId}`, { method: 'DELETE' });
                onUpdate(updatedProntuario);
                toast.info("Documento apagado.");
            } catch (error) { toast.error("Erro ao apagar documento."); }
        }
    };
    
    const handleDownload = async (doc) => {
        setActionLoading(`download-${doc._id}`);
        try {
            const token = localStorage.getItem('nutri_token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/nutri/prontuarios/${prontuario.pacienteId}/documentos/${doc._id}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Não foi possível baixar o ficheiro.");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.nome;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const documentosAgrupados = prontuario.documentos.reduce((acc, doc) => {
        const cat = doc.categoria || 'Geral';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(doc);
        return acc;
    }, {});

    return (
        <div>
            <div className="card-header-action">
                <h3>Central de Documentos</h3>
                <div className="header-buttons">
                    <button className="secondary-btn" onClick={() => setIsGeneratorModalOpen(true)}>Gerar Documento</button>
                    <button className="action-btn-positive" onClick={() => setIsUploadModalOpen(true)}>+ Adicionar Ficheiro</button>
                </div>
            </div>

            <div className="documentos-categoria-section">
                <h4>Documentos Gerados</h4>
                {historicoAtestados.length > 0 ? (
                     <ul className="documentos-list">
                        {historicoAtestados.map(doc => (
                            <li key={doc._id}>
                                <span>📝 Atestado ({doc.tipo})</span>
                                <span>{format(new Date(doc.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                <div className="actions-cell">
                                    {/* ✅ 3. O BOTÃO AGORA ABRE O MODAL DE VISUALIZAÇÃO */}
                                    <button className="action-btn-view" onClick={() => setViewingAtestado(doc)}>Ver</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p>Nenhum documento gerado para este paciente.</p>}
            </div>

            {Object.entries(documentosAgrupados).map(([categoria, docs]) => (
                <div key={categoria} className="documentos-categoria-section">
                    <h4>Ficheiros Carregados: {categoria}</h4>
                    {docs.length > 0 ? (
                        <ul className="documentos-list">
                            {docs.map(doc => (
                                <li key={doc._id}>
                                    <span>📄 {doc.nome}</span>
                                    <div className="actions-cell">
                                        <button className="action-btn-view" onClick={() => handleDownload(doc)} disabled={actionLoading === `download-${doc._id}`}>
                                            {actionLoading === `download-${doc._id}` ? 'A baixar...' : 'Baixar'}
                                        </button>
                                        <button className="action-btn-delete" onClick={() => handleDelete(doc._id)}>Apagar</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            ))}

            {isUploadModalOpen && ( <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)}> {/* ... (Formulário de upload) ... */} </Modal> )}
            {isGeneratorModalOpen && ( <GerarDocumentoModal paciente={paciente} nutricionista={nutricionista} onClose={() => setIsGeneratorModalOpen(false)} onSave={fetchHistoricoAtestados} /> )}
            
            {/* ✅ 4. O MODAL DE VISUALIZAÇÃO É RENDERIZADO QUANDO HÁ UM ATESTADO SELECIONADO */}
            {viewingAtestado && (
                <ViewAtestadoModal atestado={viewingAtestado} onClose={() => setViewingAtestado(null)} />
            )}
        </div>
    );
};

export default DocumentosTab;