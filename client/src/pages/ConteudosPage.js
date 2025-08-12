import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './ConteudosPage.css';

const ConteudosPage = () => {
    const [conteudos, setConteudos] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchConteudos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/conteudos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error("Falha ao carregar conteúdos.");
            const data = await res.json();
            setConteudos(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => { fetchConteudos(); }, [fetchConteudos]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Central de Conteúdo</h1>
                <p>Artigos, dicas e receitas para apoiar a sua jornada.</p>
            </div>
            
            <div className="conteudos-grid">
                {conteudos.length > 0 ? (
                    conteudos.map(artigo => (
                        <Card key={artigo._id} className="artigo-card-list">
                            <Link to={`/artigos/${artigo._id}`}>
                                <img src={artigo.imagemDeCapa || '/placeholder-image.png'} alt={artigo.titulo} className="artigo-imagem-list" />
                                <div className="artigo-texto-list">
                                    <span className="artigo-tipo-list">{artigo.tipo}</span>
                                    <h3>{artigo.titulo}</h3>
                                    <p>{artigo.resumo}</p>
                                </div>
                            </Link>
                        </Card>
                    ))
                ) : (
                    <p>Nenhum conteúdo publicado ainda.</p>
                )}
            </div>
        </div>
    );
};

export default ConteudosPage;