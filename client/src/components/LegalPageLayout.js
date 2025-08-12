// src/components/LegalPageLayout.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/LegalPage.css'; // Usaremos o novo CSS unificado

const LegalPageLayout = ({ children, title }) => {
    return (
        <div className="legal-page-background">
            <div className="legal-page-container">
                <header className="legal-header">
                    <Link to="/landing">
                        <img src="/bariplus_logo.png" alt="BariPlus Logo" className="legal-logo" />
                    </Link>
                </header>
                <div className="legal-content">
                    <h1>{title}</h1>
                    {children}
                    <Link to="/landing" className="back-link">
                        ‹ Voltar à Página Inicial
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LegalPageLayout;