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

    const handleChangePassword = async (e) => {
        e.preventDefault();
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
            toast.error(error.message);
        }
    };

    const handleEnableNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY; // Lendo a chave do ambiente
                const fcmToken = await getToken(messaging, { vapidKey: vapidKey });
                if (fcmToken) {
                    await fetch(`${apiUrl}/api/user/save-fcm-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ fcmToken })
                    });
                    toast.success("Notificações ativadas com sucesso!");
                }
            } else {
                toast.error("Permissão para notificações foi negada.");
            }
        } catch (error) {
            toast.error("Ocorreu um erro ao ativar as notificações.");
        }
    };

    const handleSettingsChange = async (settingKey, value) => {
        if (!usuario) return;
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
                    <div className="profile-info"><strong>Nome Completo:</strong><span>{usuario.nome} {usuario.sobrenome}</span></div>
                    <div className="profile-info"><strong>Nome de Usuário:</strong><span>{usuario.username}</span></div>
                    <div className="profile-info"><strong>Email:</strong><span>{usuario.email}</span></div>
                </div>

                <div className="profile-card">
                    <h3>Preferências de Notificação</h3>
                    <div className="setting-item">
                        <span>Lembretes de Consultas</span>
                        <label className="switch">
                            <input type="checkbox" checked={usuario.notificationSettings?.appointmentReminders ?? true} onChange={(e) => handleSettingsChange('appointmentReminders', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <span>Lembretes de Medicação</span>
                        <label className="switch">
                            <input type="checkbox" checked={usuario.notificationSettings?.medicationReminders ?? true} onChange={(e) => handleSettingsChange('medicationReminders', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <span>Lembretes de Pesagem Semanal</span>
                        <label className="switch">
                            <input type="checkbox" checked={usuario.notificationSettings?.weighInReminders ?? true} onChange={(e) => handleSettingsChange('weighInReminders', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                {/* ✅ CORREÇÃO: O card de "Alterar Senha" que estava em falta, agora está aqui. */}
                <div className="profile-card">
                    <h3>Alterar Senha</h3>
                    <form onSubmit={handleChangePassword} className="password-form">
                        <label>Senha Atual</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                        <label>Nova Senha</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        <label>Confirmar Nova Senha</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        <button type="submit">Salvar Nova Senha</button>
                    </form>
                </div>
                
                {/* ✅ CORREÇÃO: O card de "Ativar Notificações" agora está separado e completo. */}
                <div className="profile-card">
                    <h3>Notificações Push</h3>
                    <p>Ative para receber lembretes no seu dispositivo.</p>
                    <div className="notification-actions">
                        <button onClick={handleEnableNotifications} className="notification-btn">Ativar/Atualizar Permissão</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;