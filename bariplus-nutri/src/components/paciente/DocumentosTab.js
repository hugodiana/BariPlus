// src/components/paciente/DocumentosTab.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../../utils/api';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';
import '../../pages/ProntuarioPage.css';

const DocumentosTab = ({ prontuario, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({ nome: '', categoria: 'Laudos' });

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return toast.warn("Por favor, selecione um ficheiro.");
        
        setLoading(true);
        const data = new FormData();
        data.append('documento', file);
        data.append('nome', formData.nome || file.name);
        data.append('categoria', formData.categoria);

        try {
            const token = localStorage.getItem('nutri_token');
            // Usamos o fetch nativo aqui porque o nosso fetchApi é para JSON, não para FormData
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/nutri/prontuarios/${prontuario.pacienteId}/documentos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data,
            });
            
            const updatedProntuario = await response.json();
            if (!response.ok) throw new Error(updatedProntuario.message || 'Erro no servidor');

            onUpdate(updatedProntuario);
            setIsModalOpen(false);
            setFile(null);
            setFormData({ nome: '', categoria: 'Laudos' });
            toast.success("Documento enviado com sucesso!");
        } catch (error) {
            toast.error(error.message || "Erro ao enviar documento.");
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

    return (
        <div>
            <div className="card-header-action">
                <h3>Documentos do Paciente</h3>
                <button className="action-btn-positive" onClick={() => setIsModalOpen(true)}>+ Adicionar Documento</button>
            </div>

            <div className="admin-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome do Ficheiro</th>
                            <th>Categoria</th>
                            <th>Data de Upload</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prontuario.documentos.map(doc => (
                            <tr key={doc._id}>
                                <td>{doc.nome}</td>
                                <td>{doc.categoria}</td>
                                <td>{format(new Date(doc.dataUpload), 'dd/MM/yyyy', { locale: ptBR })}</td>
                                <td className="actions-cell">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="action-btn-view">Baixar</a>
                                    <button className="action-btn-delete" onClick={() => handleDelete(doc._id)}>Apagar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2>Adicionar Novo Documento</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Ficheiro (PDF, JPG, PNG)</label>
                        <input type="file" onChange={handleFileChange} required />
                    </div>
                    <div className="form-group">
                        <label>Nome do Documento (opcional)</label>
                        <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Se deixar em branco, usa o nome do ficheiro" />
                    </div>
                    <div className="form-group">
                        <label>Categoria</label>
                        <select name="categoria" value={formData.categoria} onChange={handleInputChange}>
                            <option>Laudos</option>
                            <option>Pedidos de Exame</option>
                            <option>Geral</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'A enviar...' : 'Enviar'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DocumentosTab;