import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Nav, Button, Offcanvas } from 'react-bootstrap';
import { toast } from 'react-toastify';

// Componente NavItem simplificado para usar Nav.Link do react-bootstrap
const NavItem = ({ to, icon, text, onClick, end = false }) => (
    <Nav.Link as={NavLink} to={to} end={end} onClick={onClick} className="d-flex align-items-center gap-2 py-2 px-3 rounded text-decoration-none text-dark fw-bold">
        <span className="fs-5">{icon}</span>
        <span>{text}</span>
    </Nav.Link>
);

const Layout = ({ usuario, onLogout }) => {
    const [showSidebar, setShowSidebar] = useState(false);
    const navigate = useNavigate();

    const handleCloseSidebar = () => setShowSidebar(false);
    const handleShowSidebar = () => setShowSidebar(true);

    const handleLinkClick = () => {
        handleCloseSidebar(); // Fecha o sidebar ao clicar em um link (útil para mobile)
    };

    const handleLogout = () => {
        onLogout();
        toast.info("Sessão encerrada.");
        navigate('/landing');
    };

    return (
        <Container fluid className="p-0 d-flex">
            {/* Botão Hamburger para Mobile */}
            <Button variant="light" className="d-lg-none position-fixed top-0 start-0 m-3 z-index-1000" onClick={handleShowSidebar}>
                &#9776;
            </Button>

            {/* Sidebar para Desktop */}
            <Col lg={2} className="d-none d-lg-flex flex-column vh-100 border-end p-3 shadow-sm">
                <div className="sidebar-header text-center mb-4">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="img-fluid" style={{ maxHeight: '50px' }} />
                </div>
                
                <Nav className="flex-column flex-grow-1">
                    <NavItem to="/" icon="🏠" text="Painel" onClick={handleLinkClick} end={true} />
                    {usuario?.nutricionistaId && (
                        <>
                            <NavItem to="/meu-plano" icon="🍎" text="Plano Alimentar" onClick={handleLinkClick} />
                            <NavItem to="/chat" icon="💬" text="Chat com Nutri" onClick={handleLinkClick} />
                            <NavItem to="/documentos" icon="📄" text="Meus Documentos" onClick={handleLinkClick} />
                        </>
                    )}
                    <NavItem to="/progresso" icon="📊" text="Meu Progresso" onClick={handleLinkClick} />
                    <NavItem to="/diario" icon="🥗" text="Diário Alimentar" onClick={handleLinkClick} />
                    <NavItem to="/hidratacao" icon="💧" text="Hidratação" onClick={handleLinkClick} />
                    <NavItem to="/checklist" icon="✅" text="Checklist" onClick={handleLinkClick} />
                    <NavItem to="/medicacao" icon="💊" text="Medicação" onClick={handleLinkClick} />
                    <NavItem to="/consultas" icon="🗓️" text="Consultas" onClick={handleLinkClick} />
                    <NavItem to="/exames" icon="⚕️" text="Meus Exames" onClick={handleLinkClick} />
                    <NavItem to="/gastos" icon="💳" text="Meus Gastos" onClick={handleLinkClick} />
                    <NavItem to="/conquistas" icon="🏆" text="Conquistas" onClick={handleLinkClick} />
                    <NavItem to="/artigos" icon="📚" text="Conteúdo" onClick={handleLinkClick} />
                    <NavItem to="/relatorios" icon="🔗" text="Relatórios" onClick={handleLinkClick} />
                    <NavItem to="/ganhe-renda-extra" icon="💰" text="Renda Extra" onClick={handleLinkClick} />
                </Nav>

                <div className="mt-auto pt-3 border-top">
                    <Nav.Link as={NavLink} to="/perfil" className="d-flex align-items-center gap-2 p-2 rounded text-decoration-none text-dark mb-2 bg-light" onClick={handleLinkClick}>
                        <img src={usuario?.fotoPerfilUrl || 'https://i.imgur.com/V4RclNb.png'} alt="Perfil" className="rounded-circle" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                        <div className="d-flex flex-column overflow-hidden">
                            <span className="fw-bold text-truncate">{usuario?.nome}</span>
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>{usuario?.email}</span>
                        </div>
                    </Nav.Link>
                    <Button variant="outline-danger" className="w-100 d-flex align-items-center justify-content-center gap-2" onClick={handleLogout}>
                        <span className="fs-5">🚪</span>
                        <span>Sair</span>
                    </Button>
                </div>
            </Col>

            {/* Offcanvas Sidebar para Mobile */}
            <Offcanvas show={showSidebar} onHide={handleCloseSidebar} responsive="lg">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        <img src="/bariplus_logo.png" alt="BariPlus Logo" className="img-fluid" style={{ maxHeight: '50px' }} />
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column">
                    <Nav className="flex-column flex-grow-1">
                        <NavItem to="/" icon="🏠" text="Painel" onClick={handleLinkClick} end={true} />
                        {usuario?.nutricionistaId && (
                            <>
                                <NavItem to="/meu-plano" icon="🍎" text="Plano Alimentar" onClick={handleLinkClick} />
                                <NavItem to="/chat" icon="💬" text="Chat com Nutri" onClick={handleLinkClick} />
                                <NavItem to="/documentos" icon="📄" text="Meus Documentos" onClick={handleLinkClick} />
                            </>
                        )}
                        <NavItem to="/progresso" icon="📊" text="Meu Progresso" onClick={handleLinkClick} />
                        <NavItem to="/diario" icon="🥗" text="Diário Alimentar" onClick={handleLinkClick} />
                        <NavItem to="/hidratacao" icon="💧" text="Hidratação" onClick={handleLinkClick} />
                        <NavItem to="/checklist" icon="✅" text="Checklist" onClick={handleLinkClick} />
                        <NavItem to="/medicacao" icon="💊" text="Medicação" onClick={handleLinkClick} />
                        <NavItem to="/consultas" icon="🗓️" text="Consultas" onClick={handleLinkClick} />
                        <NavItem to="/exames" icon="⚕️" text="Meus Exames" onClick={handleLinkClick} />
                        <NavItem to="/gastos" icon="💳" text="Meus Gastos" onClick={handleLinkClick} />
                        <NavItem to="/conquistas" icon="🏆" text="Conquistas" onClick={handleLinkClick} />
                        <NavItem to="/artigos" icon="📚" text="Conteúdo" onClick={handleLinkClick} />
                        <NavItem to="/relatorios" icon="🔗" text="Relatórios" onClick={handleLinkClick} />
                        <NavItem to="/ganhe-renda-extra" icon="💰" text="Renda Extra" onClick={handleLinkClick} />
                    </Nav>

                    <div className="mt-auto pt-3 border-top">
                        <Nav.Link as={NavLink} to="/perfil" className="d-flex align-items-center gap-2 p-2 rounded text-decoration-none text-dark mb-2 bg-light" onClick={handleLinkClick}>
                            <img src={usuario?.fotoPerfilUrl || 'https://i.imgur.com/V4RclNb.png'} alt="Perfil" className="rounded-circle" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                            <div className="d-flex flex-column overflow-hidden">
                                <span className="fw-bold text-truncate">{usuario?.nome}</span>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>{usuario?.email}</span>
                            </div>
                        </Nav.Link>
                        <Button variant="outline-danger" className="w-100 d-flex align-items-center justify-content-center gap-2" onClick={handleLogout}>
                            <span className="fs-5">🚪</span>
                            <span>Sair</span>
                        </Button>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>

            {/* Main Content */}
            <Col lg={10} className="p-3">
                <Outlet context={{ user: usuario }} />
            </Col>
        </Container>
    );
};

export default Layout;