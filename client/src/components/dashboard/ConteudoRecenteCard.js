import React from 'react';
import { Link } from 'react-router-dom';
import { Card, ListGroup, Button } from 'react-bootstrap';

const ConteudoRecenteCard = ({ conteudos }) => {
    return (
        <Card className="h-100">
            <Card.Header as="h3" className="mb-0 pb-2 border-bottom">
                Novidades no BariPlus
            </Card.Header>
            <Card.Body className="p-0">
                {conteudos.length > 0 ? (
                    <ListGroup variant="flush">
                        {conteudos.slice(0, 3).map(artigo => (
                            <ListGroup.Item key={artigo._id} action as={Link} to={`/artigos/${artigo._id}`} className="d-flex align-items-center gap-3 py-3">
                                <img src={artigo.imagemDeCapa || '/placeholder-image.png'} alt={artigo.titulo} className="img-fluid rounded" style={{ width: '80px', height: '60px', objectFit: 'cover' }} />
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fs-6 text-dark fw-bold">{artigo.titulo}</h4>
                                    <p className="mb-0 small text-muted text-truncate">{artigo.resumo}</p>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                ) : (
                    <p className="text-center text-muted p-3">Nenhuma novidade por enquanto.</p>
                )}
            </Card.Body>
            <Card.Footer className="text-center">
                <Button as={Link} to="/artigos" variant="link" className="text-decoration-none">
                    Ver todos os artigos
                </Button>
            </Card.Footer>
        </Card>
    );
};

export default ConteudoRecenteCard;