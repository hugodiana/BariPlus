import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';

const LegalPageLayout = ({ children, title }) => {
    return (
        <Container fluid className="bg-light min-vh-100 py-4 py-lg-5">
            <Card className="mx-auto shadow-md rounded overflow-hidden" style={{ maxWidth: '800px' }}>
                <Card.Header className="p-3 border-bottom text-center">
                    <Link to="/landing">
                        <img src="/bariplus_logo.png" alt="BariPlus Logo" className="img-fluid" style={{ maxHeight: '40px' }} />
                    </Link>
                </Card.Header>
                <Card.Body className="p-4 p-lg-5 text-secondary">
                    <h1 className="fs-2 fw-bold text-dark mb-2">{title}</h1>
                    {children}
                    <Link to="/landing" className="d-inline-block mt-4 text-decoration-none fw-bold text-primary">
                        ‹ Voltar à Página Inicial
                    </Link>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default LegalPageLayout;