// src/components/ConteudoFormModal.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { fetchAdminApi } from '../utils/api';
import Modal from './Modal';
import './ConteudoFormModal.css'; // Criaremos este ficheiro a seguir

const ConteudoFormModal = ({ item, onClose, onSave }) => {
    // Se estamos a editar, usamos os dados do item. Se não, começamos com um formulário vazio.
    const [formData, setFormData] = useState(
        item || {
            titulo: '',
            resumo: '',
            conteudoCompleto: '',
            imagemDeCapa: '',
            tipo: 'Artigo',
            publicado: false,
        }
    );
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const isEditing = !!item;
        const url = isEditing ? `/api/admin/conteudos/${item._id}` : '/api/admin/conteudos';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await fetchAdminApi(url, {
                method,
                body: JSON.stringify(formData),
            });
            toast.success(`Conteúdo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            onSave(); // Recarrega a lista na página principal
            onClose(); // Fecha o modal
        } catch (error) {
            toast.error(error.message || 'Erro ao guardar o conteúdo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <h2>{item ? 'Editar Conteúdo' : 'Criar Novo Conteúdo'}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label>Título</label>
                    <input type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Resumo (para os cards)</label>
                    <input type="text" name="resumo" value={formData.resumo} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>URL da Imagem de Capa</label>
                    <input type="url" name="imagemDeCapa" value={formData.imagemDeCapa} onChange={handleInputChange} placeholder="https://..." />
                </div>
                <div className="form-group">
                    <label>Conteúdo Completo (pode usar HTML)</label>
                    <textarea name="conteudoCompleto" value={formData.conteudoCompleto} onChange={handleInputChange} required rows="10"></textarea>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Tipo</label>
                        <select name="tipo" value={formData.tipo} onChange={handleInputChange}>
                            <option>Artigo</option>
                            <option>Receita</option>
                            <option>Vídeo</option>
                        </select>
                    </div>
                    <div className="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="publicado" checked={formData.publicado} onChange={handleInputChange} />
                            Publicar agora?
                        </label>
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? 'A guardar...' : 'Guardar Conteúdo'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ConteudoFormModal;