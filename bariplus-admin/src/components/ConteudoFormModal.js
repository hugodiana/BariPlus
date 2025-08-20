// src/components/ConteudoFormModal.js
import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { Editor } from '@tinymce/tinymce-react'; // ✅ 1. IMPORTAR O NOVO EDITOR
import { fetchAdminApi } from '../utils/api';
import Modal from './Modal';
import './ConteudoFormModal.css';

const ConteudoFormModal = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState(
        item || {
            titulo: '', resumo: '', conteudoCompleto: '', imagemDeCapa: '',
            tipo: 'Artigo', publicado: false,
        }
    );
    const [loading, setLoading] = useState(false);
    const editorRef = useRef(null); // ✅ 2. REFERÊNCIA PARA O EDITOR

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

        // ✅ 3. OBTER O CONTEÚDO ATUAL DO EDITOR
        const conteudoCompleto = editorRef.current ? editorRef.current.getContent() : '';

        const isEditing = !!item;
        const url = isEditing ? `/api/admin/conteudos/${item._id}` : '/api/admin/conteudos';
        const method = isEditing ? 'PUT' : 'POST';

        const finalFormData = { ...formData, conteudoCompleto };

        try {
            await fetchAdminApi(url, {
                method,
                body: JSON.stringify(finalFormData),
            });
            toast.success(`Conteúdo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            onSave();
            onClose();
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
                {/* ... outros campos do formulário ... */}
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

                {/* ✅ 4. SUBSTITUIR O REACTQUILL PELO EDITOR TINYMCE */}
                <div className="form-group">
                    <label>Conteúdo Completo</label>
                    <Editor
                        apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
                        onInit={(evt, editor) => editorRef.current = editor}
                        initialValue={formData.conteudoCompleto}
                        init={{
                            height: 300,
                            menubar: false,
                            plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                                'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                                'bold italic forecolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'removeformat | help',
                            content_style: 'body { font-family:Inter,sans-serif; font-size:14px }'
                        }}
                    />
                </div>

                {/* ... resto do formulário ... */}
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