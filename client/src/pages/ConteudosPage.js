import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchApi } from '../utils/api';
import './ConteudosPage.css';

const ConteudosPage = () => {
    const [conteudos, setConteudos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Todos');

    const fetchConteudos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/api/conteudos');
            if (!res.ok) throw new Error("Falha ao carregar conteúdos.");
            const data = await res.json();
            setConteudos(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchConteudos(); }, [fetchConteudos]);

    const { featuredArticle, filteredArticles } = useMemo(() => {
        if (conteudos.length === 0) {
            return { featuredArticle: null, filteredArticles: [] };
        }
        // O artigo em destaque é sempre o mais recente
        const [latest, ...rest] = conteudos;
        
        const filtered = activeFilter === 'Todos' 
            ? rest 
            : rest.filter(artigo => artigo.tipo === activeFilter);

        return { featuredArticle: latest, filteredArticles: filtered };
    }, [conteudos, activeFilter]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Central de Conteúdo</h1>
                <p>Artigos, dicas e receitas para apoiar a sua jornada.</p>
            </div>

            {featuredArticle && (
                <Card className="featured-article-card">
                    <Link to={`/artigos/${featuredArticle._id}`}>
                        <img src={featuredArticle.imagemDeCapa || '/placeholder-image.png'} alt={featuredArticle.titulo} className="featured-image" />
                        <div className="featured-info">
                            <span className="artigo-tipo-list">{featuredArticle.tipo}</span>
                            <h2>{featuredArticle.titulo}</h2>
                            <p>{featuredArticle.resumo}</p>
                        </div>
                    </Link>
                </Card>
            )}
            
            <div className="content-filters">
                <button className={activeFilter === 'Todos' ? 'active' : ''} onClick={() => setActiveFilter('Todos')}>Todos</button>
                <button className={activeFilter === 'Artigo' ? 'active' : ''} onClick={() => setActiveFilter('Artigo')}>Artigos</button>
                <button className={activeFilter === 'Receita' ? 'active' : ''} onClick={() => setActiveFilter('Receita')}>Receitas</button>
            </div>

            {filteredArticles.length > 0 ? (
                <div className="conteudos-grid">
                    {filteredArticles.map(artigo => (
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
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>Nenhum outro conteúdo encontrado para esta categoria.</p>
                </div>
            )}
        </div>
    );
};

export default ConteudosPage;