// src/components/paciente/DocumentosTab.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../../utils/api';
import Modal from '../Modal';
import '../../pages/ProntuarioPage.css';

const DocumentosTab = ({ prontuario, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // Para loading de botões específicos
    const [formData, setFormData] = useState({
        nome: '',
        categoria: 'Laudos',
        ficheiro: null
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, ficheiro: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
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
            if (!response.ok) {
                throw new Error(updatedProntuario.message || 'Falha no upload.');
            }
            
            onUpdate(updatedProntuario);
            setIsModalOpen(false);
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
            } catch (error) {
                toast.error("Erro ao apagar documento.");
            }
        }
    };

    // ✅ NOVA FUNÇÃO PARA COMPARTILHAR
    const handleToggleShare = async (docId) => {
        setActionLoading(`share-${docId}`);
        try {
            const updatedProntuario = await fetchApi(`/api/nutri/prontuarios/${prontuario.pacienteId}/documentos/${docId}/toggle-share`, { method: 'POST' });
            onUpdate(updatedProntuario);
        } catch (error) {
            toast.error("Erro ao alterar o compartilhamento.");
        } finally {
            setActionLoading(null);
        }
    };

    // ✅ NOVA FUNÇÃO PARA ENVIAR E-MAIL
    const handleSendEmail = async (docId) => {
        setActionLoading(`email-${docId}`);
        try {
            const data = await fetchApi(`/api/nutri/prontuarios/${prontuario.pacienteId}/documentos/${docId}/send-email`, { method: 'POST' });
            toast.success(data.message);
        } catch (error) {
            toast.error(error.message || "Não foi possível enviar o e-mail.");
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
                <button className="action-btn-positive" onClick={() => setIsModalOpen(true)}>+ Adicionar Documento</button>
            </div>

            {Object.keys(documentosAgrupados).length > 0 ? (
                Object.entries(documentosAgrupados).map(([categoria, docs]) => (
                    <div key={categoria} className="documentos-categoria-section">
                        <h4>{categoria}</h4>
                        <ul className="documentos-list">
                            {docs.map(doc => (
                                <li key={doc._id}>
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer">📄 {doc.nome}</a>
                                    <span>{format(new Date(doc.dataUpload), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                    {/* ✅ NOVOS BOTÕES DE AÇÃO */}
                                    <div className="actions-cell">
                                        <button 
                                            className={`action-btn-share ${doc.partilhado ? 'active' : ''}`} 
                                            onClick={() => handleToggleShare(doc._id)}
                                            disabled={actionLoading === `share-${doc._id}`}
                                        >
                                            {doc.partilhado ? 'No App ✓' : 'Compartilhar no App'}
                                        </button>
                                        <button 
                                            className="action-btn-email"
                                            onClick={() => handleSendEmail(doc._id)}
                                            disabled={actionLoading === `email-${doc._id}`}
                                        >
                                            {actionLoading === `email-${doc._id}` ? 'Enviando...' : 'E-mail'}
                                        </button>
                                        <button className="action-btn-delete" onClick={() => handleDelete(doc._id)}>Apagar</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            ) : (
                <p>Nenhum documento carregado para este paciente.</p>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Carregar Novo Documento</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Ficheiro (PDF, JPG, PNG)</label>
                        <input type="file" name="ficheiro" onChange={handleFileChange} required />
                    </div>
                    <div className="form-group">
                        <label>Nome do Documento (Opcional)</label>
                        <input type="text" name="nome" placeholder="Se vazio, usa o nome do ficheiro" onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Categoria</label>
                        <select name="categoria" value={formData.categoria} onChange={handleInputChange}>
                            <option>Laudos</option>
                            <option>Pedidos de Exame</option>
                            <option>Resultados de Exame</option>
                            <option>Outros</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'A carregar...' : 'Guardar Documento'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DocumentosTab;