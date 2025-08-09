import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import './ConteudoRecenteCard.css';

const ConteudoRecenteCard = ({ conteudos }) => {
    return (
        <Card className="dashboard-card conteudo-recente-card">
            <h3>Novidades no BariPlus</h3>
            {conteudos.length > 0 ? (
                <ul className="conteudo-lista">
                    {conteudos.slice(0, 3).map(artigo => (
                        <li key={artigo._id}>
                            <Link to={`/artigos/${artigo._id}`} className="artigo-link">
                                <img src={artigo.imagemDeCapa || '/placeholder-image.png'} alt={artigo.titulo} className="artigo-imagem-thumb" />
                                <div className="artigo-info">
                                    <h4>{artigo.titulo}</h4>
                                    <p>{artigo.resumo}</p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-state">Nenhuma novidade por enquanto.</p>
            )}
            <Link to="/artigos" className="summary-action-btn">Ver todos os artigos</Link>
        </Card>
    );
};

export default ConteudoRecenteCard;