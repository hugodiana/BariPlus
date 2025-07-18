import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import { toast } from 'react-toastify';
import { messaging } from '../firebase'; // Importa a nossa configuração do Firebase
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
            if (!response.ok) {
                throw new Error(data.message || "Não foi possível alterar a senha.");
            }
            toast.success("Senha alterada com sucesso!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.message);
        }
    };

    // ✅ NOVIDADE: Função para ativar as notificações
    const handleEnableNotifications = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const vapidKey = "BO6r0_2ceNtjYoYOFxjpWTQ9kziRPGXtIK4kSGYaN25nMJIhvpcpDECYte0NFvhnJPbcgVKeFj-vcYOH_2CXHTQ";
            const fcmToken = await getToken(messaging, { vapidKey: vapidKey });

            if (fcmToken) {
                // ✅ NOVIDADE: Enviando o token para o back-end
                await fetch(`${apiUrl}/api/user/save-fcm-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
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

// ✅ NOVIDADE: Função para chamar a rota de teste
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

                {/* ✅ NOVIDADE: Card para gerir notificações */}
                <div className="profile-card">
    <h3>Notificações</h3>
    <p>Receba lembretes sobre consultas, medicamentos e metas diárias.</p>
    <div className="notification-actions">
        <button onClick={handleEnableNotifications} className="notification-btn">Ativar Notificações</button>
        <button onClick={handleSendTestNotification} className="notification-btn-test">Enviar Teste</button>
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