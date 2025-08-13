import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchApi } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './ArtigoPage.css';

const ArtigoPage = () => {
    const { id } = useParams();
    const [artigo, setArtigo] = useState(null);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchArtigoData = useCallback(async () => {
        setLoading(true);
        try {
            const [resArtigo, resRelated] = await Promise.all([
                fetchApi(`/api/conteudos/${id}`),
                fetchApi(`/api/conteudos/related/${id}`) // Novo endpoint para artigos relacionados
            ]);

            if (!resArtigo.ok) throw new Error("Artigo não encontrado ou não publicado.");
            
            const dataArtigo = await resArtigo.json();
            const dataRelated = resRelated.ok ? await resRelated.json() : [];

            setArtigo(dataArtigo);
            setRelatedArticles(dataRelated);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        window.scrollTo(0, 0); // Garante que a página comece no topo ao navegar
        fetchArtigoData();
    }, [fetchArtigoData]);

    if (loading) return <LoadingSpinner />;
    if (!artigo) return <div className="page-container"><p>Artigo não encontrado.</p></div>;

    const shareUrl = window.location.href;
    const shareTitle = encodeURIComponent(artigo.titulo);

    return (
        <div className="page-container artigo-page-layout">
            <div className="artigo-main-content">
                <Link to="/artigos" className="back-link">‹ Voltar para todos os artigos</Link>
                <article>
                    <header className="artigo-header">
                        <span className="artigo-category-tag">{artigo.tipo}</span>
                        <h1>{artigo.titulo}</h1>
                        <div className="artigo-meta">
                            <span>Por <strong>{artigo.autor}</strong></span>
                            <span>Publicado em {format(new Date(artigo.createdAt), 'dd MMMM, yyyy', { locale: ptBR })}</span>
                        </div>
                    </header>
                    {artigo.imagemDeCapa && <img src={artigo.imagemDeCapa} alt={artigo.titulo} className="artigo-imagem-full" />}
                    <div 
                        className="artigo-conteudo"
                        dangerouslySetInnerHTML={{ __html: artigo.conteudoCompleto }} 
                    />
                </article>
                
                <div className="share-section">
                    <h4>Gostou deste conteúdo? Partilhe!</h4>
                    <div className="share-buttons">
                        <a href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`} target="_blank" rel="noopener noreferrer" className="share-btn whatsapp">WhatsApp</a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="share-btn facebook">Facebook</a>
                        <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`} target="_blank" rel="noopener noreferrer" className="share-btn linkedin">LinkedIn</a>
                    </div>
                </div>
            </div>

            {relatedArticles.length > 0 && (
                <aside className="related-articles-sidebar">
                    <h3>Leia a Seguir</h3>
                    <div className="related-articles-list">
                        {relatedArticles.map(related => (
                            <Link to={`/artigos/${related._id}`} key={related._id} className="related-article-card">
                                <img src={related.imagemDeCapa || '/placeholder-image.png'} alt={related.titulo} />
                                <div className="related-article-info">
                                    <span>{related.tipo}</span>
                                    <h4>{related.titulo}</h4>
                                </div>
                            </Link>
                        ))}
                    </div>
                </aside>
            )}
        </div>
    );
};

export default ArtigoPage;