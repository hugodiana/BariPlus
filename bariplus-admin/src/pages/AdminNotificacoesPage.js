// src/pages/AdminNotificacoesPage.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { fetchAdminApi } from '../utils/api';
import Card from '../components/ui/Card';
import './AdminPages.css';

const AdminNotificacoesPage = () => {
    const [formData, setFormData] = useState({ title: '', body: '', link: '' });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await fetchAdminApi('/api/admin/notifications/broadcast', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            toast.success(`${data.successCount} notificações enviadas com sucesso!`);
            setFormData({ title: '', body: '', link: '' });
        } catch (error) {
            toast.error(error.message || "Erro ao enviar notificações.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Notificações em Massa</h1>
                <p>Envie uma notificação push para todos os utilizadores do aplicativo.</p>
            </div>
            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Título da Notificação</label>
                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Corpo da Mensagem</label>
                        <textarea name="body" value={formData.body} onChange={handleInputChange} required rows="4"></textarea>
                    </div>
                    <div className="form-group">
                        <label>Link (Opcional)</label>
                        <input type="url" name="link" value={formData.link} onChange={handleInputChange} placeholder="https://..." />
                    </div>
                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? 'A enviar...' : 'Enviar Notificação para Todos'}
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default AdminNotificacoesPage;