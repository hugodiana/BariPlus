// client/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChartPie, faWeightScale, faListCheck, faFileLines, faUtensils, faBookMedical, 
    faDollarSign, faMedkit, faGlassWater, faTrophy, faComments, faUser, 
    faDumbbell, faFileInvoice 
} from '@fortawesome/free-solid-svg-icons';
import { fetchApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import './ProfilePage.css';

// Componente auxiliar para os itens de informação
const InfoItem = ({ label, value }) => (
    <div className="profile-info-item">
        <strong>{label}</strong>
        <span>{value}</span>
    </div>
);

// Lista completa de links que estava no Layout, agora aqui para o menu "Mais"
const navLinks = [
    { to: "/", icon: faChartPie, text: "Dashboard" },
    { to: "/progresso", icon: faWeightScale, text: "Progresso" },
    { to: "/diario-alimentar", icon: faUtensils, text: "Diário" },
    { to: "/meu-plano", icon: faFileLines, text: "Meu Plano" },
    { to: "/hidratacao", icon: faGlassWater, text: "Hidratação" },
    { to: "/checklist", icon: faListCheck, text: "Checklist" },
    { to: "/medicacao", icon: faMedkit, text: "Medicação" },
    { to: "/consultas", icon: faBookMedical, text: "Consultas" },
    { to: "/exames", icon: faDumbbell, text: "Meus Exames" },
    { to: "/documentos", icon: faFileInvoice, text: "Meus Documentos" },
    { to: "/gastos", icon: faDollarSign, text: "Meus Gastos" },
    { to: "/conquistas", icon: faTrophy, text: "Conquistas" },
    { to: "/chat", icon: faComments, text: "Chat com Nutri" },
];


const ProfilePage = () => {
    const { user, updateUser } = useAuth(); // Usando o updateUser do contexto
    const [loading, setLoading] = useState(false); // A página principal já tem um spinner
    const [isEditMode, setIsEditMode] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        nome: '', sobrenome: '',
        metaPeso: '',
        detalhesCirurgia: {
            fezCirurgia: 'nao', dataCirurgia: '', altura: '', pesoInicial: '',
        }
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });
    
    const [passwordValidations, setPasswordValidations] = useState({
        length: false, uppercase: false, number: false, specialChar: false,
    });
    
    // Sincroniza o formulário com os dados do usuário quando entra no modo de edição
    useEffect(() => {
        if (user && isEditMode) {
            setFormData({
                nome: user.nome || '',
                sobrenome: user.sobrenome || '',
                metaPeso: user.metaPeso || '',
                detalhesCirurgia: {
                    fezCirurgia: user.detalhesCirurgia?.fezCirurgia || 'nao',
                    dataCirurgia: user.detalhesCirurgia?.dataCirurgia ? format(parseISO(user.detalhesCirurgia.dataCirurgia), 'yyyy-MM-dd') : '',
                    altura: user.detalhesCirurgia?.altura || '',
                    pesoInicial: user.detalhesCirurgia?.pesoInicial || '',
                }
            });
        }
    }, [user, isEditMode]);
    
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updatedUserData = await fetchApi('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            updateUser(updatedUserData); // Atualiza o usuário no contexto global
            setIsEditMode(false);
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const validatePassword = (password) => {
        const validations = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
        setPasswordValidations(validations);
        return Object.values(validations).every(Boolean);
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (name === 'newPassword') {
            validatePassword(value);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!validatePassword(passwordData.newPassword)) return toast.error("A nova senha não cumpre os requisitos.");
        if (passwordData.newPassword !== passwordData.confirmPassword) return toast.error("As senhas não coincidem.");
        setLoading(true);
        try {
            const data = await fetchApi('/api/user/change-password', {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            });
            toast.success(data.message || "Senha alterada com sucesso!");
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handlePictureUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('fotoPerfil', file);
        setIsUploading(true);

        try {
            const token = localStorage.getItem('bariplus_token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/profile-picture`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: uploadFormData
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || 'Falha no upload da imagem.');
            }
            
            const data = await response.json();
            updateUser(data.usuario); // Atualiza o usuário no contexto
            toast.success('Foto de perfil atualizada!');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    if (!user) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header-actions">
                <div className="page-header">
                    <h1>Perfil e Navegação</h1>
                    <p>Acesse as funcionalidades do app e gerencie seus dados.</p>
                </div>
                <button className="edit-profile-btn" onClick={() => setIsEditMode(!isEditMode)}>
                    {isEditMode ? 'Cancelar Edição' : 'Editar Dados e Metas'}
                </button>
            </div>
            
            <div className="profile-page-grid">
                <Card className="profile-nav-card">
                    <h3>Menu Principal</h3>
                    <nav>
                        <ul className="profile-nav-list">
                            {navLinks.map(link => (
                                <li key={link.to} className="profile-nav-item">
                                    <NavLink to={link.to} className="profile-nav-link" end={link.to === "/"}>
                                        <FontAwesomeIcon icon={link.icon} className="nav-icon" />
                                        <span>{link.text}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </Card>

                {isEditMode ? (
                    <form onSubmit={handleUpdateProfile}>
                        <div className="profile-forms-grid">
                            <Card>
                                <h3>Dados Pessoais</h3>
                                <div className="form-group"><label>Nome</label><input type="text" name="nome" value={formData.nome} onChange={handleFormChange} /></div>
                                <div className="form-group"><label>Sobrenome</label><input type="text" name="sobrenome" value={formData.sobrenome} onChange={handleFormChange} /></div>
                            </Card>
                            <Card>
                                <h3>Cirurgia e Metas</h3>
                                <div className="form-group"><label>Já fez a cirurgia?</label><select name="detalhesCirurgia.fezCirurgia" value={formData.detalhesCirurgia.fezCirurgia} onChange={handleFormChange}><option value="nao">Não</option><option value="sim">Sim</option></select></div>
                                <div className="form-group"><label>Data da Cirurgia</label><input type="date" name="detalhesCirurgia.dataCirurgia" value={formData.detalhesCirurgia.dataCirurgia} onChange={handleFormChange} /></div>
                                <div className="form-group"><label>Altura (cm)</label><input type="number" name="detalhesCirurgia.altura" value={formData.detalhesCirurgia.altura} onChange={handleFormChange} /></div>
                                <div className="form-group"><label>Peso Inicial (kg)</label><input type="number" step="0.1" name="detalhesCirurgia.pesoInicial" value={formData.detalhesCirurgia.pesoInicial} onChange={handleFormChange} /></div>
                                <div className="form-group"><label>Meta de Peso (kg)</label><input type="number" step="0.1" name="metaPeso" value={formData.metaPeso} onChange={handleFormChange} /></div>
                            </Card>
                        </div>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? 'A salvar...' : 'Salvar Alterações'}
                        </button>
                    </form>
                ) : (
                    <div className="profile-info-grid">
                        <Card>
                            <h3>Meus Dados</h3>
                            <div className="profile-picture-container">
                                <img src={user.fotoPerfilUrl || 'https://i.imgur.com/V4RclNb.png'} alt="Foto de Perfil" className="profile-picture" />
                                <label htmlFor="picture-upload" className="picture-upload-label">
                                    {isUploading ? 'A enviar...' : 'Alterar Foto'}
                                </label>
                                <input id="picture-upload" type="file" accept="image/png, image/jpeg" onChange={handlePictureUpload} style={{ display: 'none' }} disabled={isUploading} />
                            </div>
                            <InfoItem label="Nome Completo" value={`${user.nome} ${user.sobrenome || ''}`} />
                            <InfoItem label="Nome de Usuário" value={`${user.username} (não pode ser alterado)`} />
                            <InfoItem label="Email" value={`${user.email} (não pode ser alterado)`} />
                        </Card>
                        <Card>
                            <h3>Alterar Senha</h3>
                            <form onSubmit={handleChangePassword} className="password-form">
                                <div className="form-group"><label>Senha Atual</label><input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordInputChange} required /></div>
                                <div className="form-group"><label>Nova Senha</label><input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordInputChange} required /></div>
                                <PasswordStrengthIndicator validations={passwordValidations} />
                                <div className="form-group"><label>Confirmar Nova Senha</label><input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordInputChange} required /></div>
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? 'A alterar...' : 'Alterar Senha'}
                                </button>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;