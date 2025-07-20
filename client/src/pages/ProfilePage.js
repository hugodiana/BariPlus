import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import { toast } from 'react-toastify';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';

const ProfilePage = () => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    // Estados para o formulário de senha
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Estado para a validação de senha forte
    const [passwordValidations, setPasswordValidations] = useState({
        length: false,
        uppercase: false,
        number: false,
        specialChar: false,
    });

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setUsuario(data);
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [token, apiUrl]);

    const validatePassword = (password) => {
        const validations = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            specialChar: /[!@#$%^&*(),.?":{}|<>*]/.test(password),
        };
        setPasswordValidations(validations);
        return Object.values(validations).every(Boolean);
    };

    const handleNewPasswordChange = (e) => {
        const newPass = e.target.value;
        setNewPassword(newPass);
        validatePassword(newPass);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!validatePassword(newPassword)) {
            return toast.error("A nova senha não cumpre todos os requisitos.");
        }
        if (newPassword !== confirmPassword) {
            return toast.error("A nova senha e a confirmação não coincidem.");
        }
        try {
            const response = await fetch(`${apiUrl}/api/user/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success("Senha alterada com sucesso!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.message || "Não foi possível alterar a senha.");
        }
    };

    const handleSettingsChange = async (settingKey, value) => {
        if (!usuario) return;

        // Atualiza o estado local imediatamente para uma resposta visual rápida
        const currentSettings = usuario.notificationSettings || {};
        const newSettings = { ...currentSettings, [settingKey]: value };
        setUsuario(prev => ({ ...prev, notificationSettings: newSettings }));

        try {
            await fetch(`${apiUrl}/api/user/notification-settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ settings: newSettings })
            });
            toast.success("Preferência atualizada!");
        } catch (error) {
            toast.error("Não foi possível salvar a preferência.");
            // Reverte a alteração visual se a API falhar
            setUsuario(prev => ({ ...prev, notificationSettings: usuario.notificationSettings }));
        }
    };

    if (loading || !usuario) {
        return <div className="page-container">Carregando perfil...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Meu Perfil</h1>
                <p>Aqui estão os seus dados e preferências.</p>
            </div>
            <div className="profile-grid">
                <div className="profile-card">
                    <h3>Meus Dados</h3>
                    {/* ... (o seu card "Meus Dados" continua igual) ... */}
                </div>

                {/* ✅ NOVIDADE: O card de preferências de notificação */}
                <div className="profile-card">
                    <h3>Preferências de Notificação</h3>
                    <div className="setting-item">
                        <span>Lembretes de Consultas</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={usuario.notificationSettings?.appointmentReminders ?? true} 
                                onChange={(e) => handleSettingsChange('appointmentReminders', e.target.checked)} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <span>Lembretes de Medicação</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={usuario.notificationSettings?.medicationReminders ?? true} 
                                onChange={(e) => handleSettingsChange('medicationReminders', e.target.checked)} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <span>Lembretes de Pesagem Semanal</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={usuario.notificationSettings?.weighInReminders ?? true} 
                                onChange={(e) => handleSettingsChange('weighInReminders', e.target.checked)} 
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                <div className="profile-card">
                    <h3>Alterar Senha</h3>
                    <form onSubmit={handleChangePassword} className="password-form">
                        {/* ... (o seu formulário de alteração de senha completo) ... */}
                    </form>
                </div>
                
                <div className="profile-card">
                    <h3>Notificações Push</h3>
                    <p>Ative para receber lembretes no seu dispositivo.</p>
                    <button onClick={handleEnableNotifications} className="notification-btn">Ativar/Atualizar Permissão</button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;