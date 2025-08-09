import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Estilo do editor
import './ContentEditPage.css';

const ContentEditPage = () => {
    const { id } = useParams(); // Pega o ID da URL, se estiver a editar
    const navigate = useNavigate();
    const [titulo, setTitulo] = useState('');
    const [resumo, setResumo] = useState('');
    const [conteudoCompleto, setConteudoCompleto] = useState('');
    const [tipo, setTipo] = useState('Artigo');
    const [publicado, setPublicado] = useState(false);

    const token = localStorage.getItem('bariplus_admin_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchConteudo = useCallback(async () => {
        if (!id) return;
        try {
            const res = await fetch(`${apiUrl}/api/admin/conteudos/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Falha ao carregar conteúdo para edição.");
            const data = await res.json();
            setTitulo(data.titulo);
            setResumo(data.resumo);
            setConteudoCompleto(data.conteudoCompleto);
            setTipo(data.tipo);
            setPublicado(data.publicado);
        } catch (error) {
            toast.error(error.message);
            navigate('/content');
        }
    }, [id, token, apiUrl, navigate]);

    useEffect(() => {
        fetchConteudo();
    }, [fetchConteudo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = id ? `${apiUrl}/api/admin/conteudos/${id}` : `${apiUrl}/api/admin/conteudos`;
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ titulo, resumo, conteudoCompleto, tipo, publicado })
            });
            if (!res.ok) throw new Error("Falha ao salvar conteúdo.");
            toast.success(`Conteúdo salvo com sucesso!`);
            navigate('/content');
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="content-edit-page">
            <header className="page-header">
                <h1>{id ? 'Editar Conteúdo' : 'Criar Novo Conteúdo'}</h1>
            </header>
            <form onSubmit={handleSubmit} className="content-form">
                <div className="form-group">
                    <label htmlFor="titulo">Título</label>
                    <input id="titulo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="resumo">Resumo (aparecerá nos cards)</label>
                    <textarea id="resumo" value={resumo} onChange={(e) => setResumo(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Conteúdo Completo</label>
                    <ReactQuill theme="snow" value={conteudoCompleto} onChange={setConteudoCompleto} />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="tipo">Tipo</label>
                        <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            <option value="Artigo">Artigo</option>
                            <option value="Receita">Receita</option>
                            <option value="Vídeo">Vídeo</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <div className="toggle-switch">
                            <input type="checkbox" id="publicado" checked={publicado} onChange={(e) => setPublicado(e.target.checked)} />
                            <label htmlFor="publicado">Publicado</label>
                        </div>
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