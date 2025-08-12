import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/ui/Card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './ArtigoPage.css';

const ArtigoPage = () => {
    const { id } = useParams();
    const [artigo, setArtigo] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchArtigo = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/conteudos/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Artigo não encontrado ou não publicado.");
            const data = await res.json();
            setArtigo(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [id, token, apiUrl]);

    useEffect(() => { fetchArtigo(); }, [fetchArtigo]);

    if (loading) return <LoadingSpinner />;
    if (!artigo) return <div className="page-container"><p>Artigo não encontrado.</p></div>;

    return (
        <div className="page-container artigo-container">
            <Link to="/artigos" className="voltar-btn">‹ Voltar para todos os artigos</Link>
            <h1>{artigo.titulo}</h1>
            <div className="artigo-meta">
                <span>Por {artigo.autor}</span>
                <span>Publicado em {format(new Date(artigo.createdAt), 'dd MMMM, yyyy', { locale: ptBR })}</span>
            </div>
            {artigo.imagemDeCapa && <img src={artigo.imagemDeCapa} alt={artigo.titulo} className="artigo-imagem-full" />}
            <div 
                className="artigo-conteudo"
                dangerouslySetInnerHTML={{ __html: artigo.conteudoCompleto }} 
            />
        </div>
    );
};

export default ArtigoPage;