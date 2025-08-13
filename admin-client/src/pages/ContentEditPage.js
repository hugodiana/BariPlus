import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ContentEditPage.css';

const ContentEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        titulo: '',
        resumo: '',
        conteudoCompleto: '',
        tipo: 'Artigo',
        publicado: false,
        imagemDeCapa: ''
    });
    const [loading, setLoading] = useState(!!id);
    const token = localStorage.getItem('bariplus_admin_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchConteudo = useCallback(async () => {
        if (!id) return;
        try {
            const res = await fetch(`${apiUrl}/api/admin/conteudos/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Falha ao carregar conteúdo.");
            const data = await res.json();
            setFormData(data);
        } catch (error) {
            toast.error(error.message);
            navigate('/content');
        } finally {
            setLoading(false);
        }
    }, [id, token, apiUrl, navigate]);

    useEffect(() => {
        fetchConteudo();
    }, [fetchConteudo]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleQuillChange = (value) => {
        setFormData(prev => ({ ...prev, conteudoCompleto: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = id ? `${apiUrl}/api/admin/conteudos/${id}` : `${apiUrl}/api/admin/conteudos`;
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error("Falha ao salvar conteúdo.");
            toast.success(`Conteúdo salvo com sucesso!`);
            navigate('/content');
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    if (loading) return <p>A carregar conteúdo...</p>;

    return (
        <div className="admin-page-container">
            <header className="page-header">
                <h1>{id ? 'Editar Conteúdo' : 'Criar Novo Conteúdo'}</h1>
            </header>
            <form onSubmit={handleSubmit} className="content-form">
                <div className="form-group">
                    <label htmlFor="titulo">Título</label>
                    <input id="titulo" name="titulo" type="text" value={formData.titulo} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="resumo">Resumo (aparecerá nos cards)</label>
                    <textarea id="resumo" name="resumo" value={formData.resumo} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="imagemDeCapa">URL da Imagem de Capa</label>
                    <input id="imagemDeCapa" name="imagemDeCapa" type="text" value={formData.imagemDeCapa} onChange={handleInputChange} placeholder="https://..." />
                </div>
                <div className="form-group">
                    <label>Conteúdo Completo</label>
                    <ReactQuill theme="snow" value={formData.conteudoCompleto} onChange={handleQuillChange} />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="tipo">Tipo</label>
                        <select id="tipo" name="tipo" value={formData.tipo} onChange={handleInputChange}>
                            <option value="Artigo">Artigo</option>
                            <option value="Receita">Receita</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <label className="toggle-switch">
                            <input type="checkbox" name="publicado" checked={formData.publicado} onChange={handleInputChange} />
                            <span className="slider"></span>
                            <span className="label-text">{formData.publicado ? 'Publicado' : 'Rascunho'}</span>
                        </label>
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={() => navigate('/content')}>Cancelar</button>
                    <button type="submit" className="primary-btn">Salvar Conteúdo</button>
                </div>
            </form>
        </div>
    );
};

export default ContentEditPage;