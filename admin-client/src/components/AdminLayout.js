import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiDollarSign, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { Helmet } from 'react-helmet-async';
import './AdminLayout.css';

const AdminLayout = ({ handleLogout, usuario }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(false);
    }
  }, [location]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    { path: '/dashboard', icon: <FiHome className="nav-icon" />, label: 'Dashboard' },
    { path: '/users', icon: <FiUsers className="nav-icon" />, label: 'Usuários' },
    { path: '/affiliates', icon: <FiDollarSign className="nav-icon" />, label: 'Afiliados' }
  ];

  return (
    <div className="admin-container">
      <Helmet>
        <title>Painel Administrativo - BariPlus</title>
        <meta name="description" content="Painel de administração do BariPlus" />
      </Helmet>

      {/* Botão de menu mobile */}
      <button 
        className="mobile-menu-button"
        onClick={toggleMobileMenu}
        aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay para mobile */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={toggleMobileMenu}
          role="button"
          aria-label="Fechar menu"
          tabIndex={0}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`admin-sidebar ${isMobileMenuOpen ? 'active' : ''}`}
        aria-hidden={!isMobileMenuOpen && window.innerWidth <= 768}
      >
        <div className="sidebar-header">
          <div className="brand">
            <h2>BariPlus</h2>
            <span>Admin Panel</span>
          </div>
          {usuario && (
            <div className="user-info">
              <div className="user-avatar" aria-hidden="true">
                {usuario.nome?.charAt(0) || usuario.email.charAt(0)}
              </div>
              <div className="user-details">
                <strong title={usuario.nome || 'Administrador'}>
                  {usuario.nome || 'Administrador'}
                </strong>
                <small title={usuario.email}>{usuario.email}</small>
              </div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              end
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button 
          onClick={handleLogout} 
          className="logout-btn"
          aria-label="Sair do sistema"
        >
          <FiLogOut className="logout-icon" />
          <span>Sair</span>
        </button>
      </aside>

      {/* Conteúdo principal */}
      <main className="admin-content" id="main-content">
        <div className="content-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;