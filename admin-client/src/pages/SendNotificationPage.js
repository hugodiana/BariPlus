import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner'; // Adicionado para feedback de carregamento
import './SendNotificationPage.css';

const SendNotificationPage = () => {
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        link: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.body) {
            toast.warn('Por favor, preencha o título e a mensagem.');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetchApi('/api/admin/notifications/broadcast', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Falha ao enviar notificações.');
            }

            toast.success(`Notificações enviadas! Sucesso: ${data.successCount}, Falhas: ${data.failureCount}`);
            setFormData({ title: '', body: '', link: '' });

        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-page-container">
            <header className="page-header">
                <h1>Enviar Notificação em Massa</h1>
                <p>Envie uma mensagem push para todos os usuários com notificações ativas.</p>
            </header>

            <Card>
                <form onSubmit={handleSubmit} className="notification-form">
                    <div className="form-group">
                        <label htmlFor="title">Título da Notificação</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Ex: Nova receita no BariPlus!"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="body">Corpo da Mensagem</label>
                        <textarea
                            id="body"
                            name="body"
                            rows="4"
                            value={formData.body}
                            onChange={handleInputChange}
                            placeholder="Ex: Confira agora a nossa nova receita de caldo de abóbora."
                            required
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="link">Link (URL) ao Clicar (Opcional)</label>
                        <input
                            type="url"
                            id="link"
                            name="link"
                            value={formData.link}
                            onChange={handleInputChange}
                            placeholder="https://bariplus.vercel.app/artigos/12345"
                        />
                         <small>Se deixado em branco, abrirá a página inicial do app.</small>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="primary-btn" disabled={isLoading}>
                            {isLoading && <span className="btn-spinner"></span>}
                            {isLoading ? 'Enviando...' : 'Enviar para Todos os Usuários'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SendNotificationPage;