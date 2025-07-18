import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import { toast } from 'react-toastify';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';

const ProfilePage = () => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
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
            toast.error("A nova senha e a confirmação não coincidem.");
            return;
        }
        try {
            const response = await fetch(`${apiUrl}/api/user/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Não foi possível alterar a senha.");
            toast.success("Senha alterada com sucesso!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.message);
        }
    };

    // ✅ CORREÇÃO: As funções foram movidas para DENTRO do componente
    const handleEnableNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                toast.info("Obtendo o token de notificação...");
                const vapidKey = "BLH255x4EOj3AuXL6JvX4ZouPigm5Q9aqmW4R7e0T6tVMxBcbZglrzdsdMTn9B8izsb2ZRp1F8ck4BHrHM1HjJc";
                if (!vapidKey) return toast.error("Chave de configuração de notificações não encontrada.");

                const fcmToken = await getToken(messaging, { vapidKey: vapidKey });

                if (fcmToken) {
                    await fetch(`${apiUrl}/api/user/save-fcm-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ fcmToken })
                    });
                    toast.success("Notificações ativadas com sucesso!");
                } else {
                    toast.warn("Não foi possível obter o token de notificação.");
                }
            } else {
                toast.error("Permissão para notificações foi negada.");
            }
        } catch (error) {
            toast.error("Ocorreu um erro ao ativar as notificações.");
        }
    };

    const handleSendTestNotification = async () => {
        try {
            await fetch(`${apiUrl}/api/user/send-test-notification`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.info("Pedido de notificação de teste enviado!");
        } catch (error) {
            toast.error("Erro ao enviar notificação de teste.");
        }
    };

    if (loading || !usuario) {
        return <div>Carregando perfil...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Meu Perfil</h1>
                <p>Aqui estão os seus dados cadastrados no BariPlus.</p>
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
                </div>

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
            </div>
        </div>
    );
};

export default ProfilePage;