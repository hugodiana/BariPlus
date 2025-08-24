// client/src/components/LegalPageLayout.js
import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPageLayout.css';

const LegalPageLayout = ({ title, children }) => {
    return (
        <div className="legal-page">
            <header className="legal-header">
                <div className="legal-header-content">
                    <Link to="/landing">
                        <img src="/bariplus_logo.png" alt="BariPlus Logo" className="legal-logo" />
                    </Link>
                    <Link to="/landing" className="back-link">
                        ‹ Voltar à página inicial
                    </Link>
                </div>
            </header>
            <main className="legal-content">
                <h1>{title}</h1>
                <div className="legal-text">
                    {children}
                </div>
            </main>
            <footer className="legal-footer">
                <p>© {new Date().getFullYear()} BariPlus. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default LegalPageLayout;