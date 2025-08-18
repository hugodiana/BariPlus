import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { fetchApi } from '../utils/api';
import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import './ProfilePage.css';

const ProfilePage = () => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const [formData, setFormData] = useState({
        nome: '', sobrenome: '', whatsapp: '', metaPeso: '',
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

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            // CORREÇÃO APLICADA AQUI
            const data = await fetchApi('/api/me');
            setUsuario(data);
        } catch (error) {
            toast.error(error.message || "Falha ao carregar dados do usuário.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        if (usuario) {
            setFormData({
                nome: usuario.nome || '',
                sobrenome: usuario.sobrenome || '',
                whatsapp: usuario.whatsapp || '',
                metaPeso: usuario.metaPeso || '',
                detalhesCirurgia: {
                    fezCirurgia: usuario.detalhesCirurgia?.fezCirurgia || 'nao',
                    dataCirurgia: usuario.detalhesCirurgia?.dataCirurgia ? format(parseISO(usuario.detalhesCirurgia.dataCirurgia), 'yyyy-MM-dd') : '',
                    altura: usuario.detalhesCirurgia?.altura || '',
                    pesoInicial: usuario.detalhesCirurgia?.pesoInicial || '',
                }
            });
        }
    }, [usuario, isEditMode]);
    
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
        try {
            const response = await fetchApi('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error("Falha ao atualizar o perfil.");
            
            const updatedUser = await response.json();
            setUsuario(updatedUser);
            setIsEditMode(false);
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            toast.error(error.message);
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

        try {
            const response = await fetchApi('/api/user/change-password', {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success("Senha alterada com sucesso!");
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.message || "Não foi possível alterar a senha.");
        }
    };
    
    const handleEnableNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
                if (!vapidKey) return toast.error("Configuração de notificações em falta.");
                
                const fcmToken = await getToken(messaging, { vapidKey: vapidKey });
                if (fcmToken) {
                    await fetchApi('/api/user/save-fcm-token', {
                        method: 'POST',
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
    
    const handleSendTestNotification = async () => {
        try {
            await fetchApi('/api/user/send-test-notification', { method: 'POST' });
            toast.info("Pedido de notificação de teste enviado!");
        } catch (error) {
            toast.error("Erro ao enviar notificação de teste.");
        }
    };

    const handleSettingsChange = async (settingKey, value) => {
        if (!usuario) return;
        const currentSettings = usuario.notificationSettings || {};
        const newSettings = { ...currentSettings, [settingKey]: value };
        
        // Atualização Otimista
        setUsuario(prev => ({ ...prev, notificationSettings: newSettings }));
        
        try {
            const res = await fetchApi('/api/user/notification-settings', {
                method: 'PUT',
                body: JSON.stringify({ settings: newSettings })
            });
            if (!res.ok) throw new Error("Falha ao salvar preferência.");
            toast.success("Preferência atualizada!");
        } catch (error) {
            toast.error("Não foi possível salvar a preferência. A reverter.");
            setUsuario(prev => ({ ...prev, notificationSettings: usuario.notificationSettings }));
        }
    };


    if (loading || !usuario) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header-actions">
                <div className="page-header">
                    <h1>Meu Perfil</h1>
                    <p>Aqui estão os seus dados, metas e preferências.</p>
                </div>
                <button className="edit-profile-btn" onClick={() => setIsEditMode(!isEditMode)}>
                    {isEditMode ? 'Cancelar Edição' : 'Editar Perfil e Metas'}
                </button>
            </div>
            
            {isEditMode ? (
                <form onSubmit={handleUpdateProfile}>
                    <div className="profile-grid">
                        <Card>
                            <h3>Dados Pessoais</h3>
                            <div className="form-group"><label>Nome</label><input type="text" name="nome" value={formData.nome} onChange={handleFormChange} /></div>
                            <div className="form-group"><label>Sobrenome</label><input type="text" name="sobrenome" value={formData.sobrenome} onChange={handleFormChange} /></div>
                            <div className="form-group"><label>WhatsApp</label><input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleFormChange} /></div>
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
                    <button type="submit" className="save-btn">Salvar Alterações</button>
                </form>
            ) : (
                <div className="profile-grid">
                    <Card>
                        <h3>Dados Pessoais</h3>
                        <InfoItem label="Nome Completo" value={`${usuario.nome} ${usuario.sobrenome}`} />
                        <InfoItem label="Nome de Usuário" value={`${usuario.username} (não pode ser alterado)`} />
                        <InfoItem label="Email" value={`${usuario.email} (não pode ser alterado)`} />
                        <InfoItem label="WhatsApp" value={usuario.whatsapp || 'Não informado'} />
                    </Card>
                    <Card>
                        <h3>Segurança</h3>
                        <form onSubmit={handleChangePassword} className="password-form">
                            <div className="form-group"><label>Senha Atual</label><input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordInputChange} required /></div>
                            <div className="form-group"><label>Nova Senha</label><input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordInputChange} required /></div>
                            <PasswordStrengthIndicator validations={passwordValidations} />
                            <div className="form-group"><label>Confirmar Nova Senha</label><input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordInputChange} required /></div>
                            <button type="submit" className="primary-btn">Alterar Senha</button>
                        </form>
                    </Card>
                    <Card>
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
                    </Card>
                    <Card>
                        <h3>Notificações Push</h3>
                        <p>Ative para receber lembretes no seu dispositivo.</p>
                        <div className="notification-actions">
                            <button onClick={handleEnableNotifications} className="notification-btn">Ativar/Atualizar</button>
                            <button onClick={handleSendTestNotification} className="notification-btn-test">Enviar Teste</button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

const InfoItem = ({ label, value }) => (
    <div className="profile-info-item">
        <strong>{label}</strong>
        <span>{value}</span>
    </div>
);

export default ProfilePage;