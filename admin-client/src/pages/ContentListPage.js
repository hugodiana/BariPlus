import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './ContentListPage.css';

const ContentListPage = () => {
    const [conteudos, setConteudos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchConteudos = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bariplus_admin_token');
            const apiUrl = process.env.REACT_APP_API_URL;
            const res = await fetch(`${apiUrl}/api/admin/conteudos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Falha ao carregar conteúdos.");
            const data = await res.json();
            setConteudos(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConteudos();
    }, [fetchConteudos]);

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja apagar este conteúdo?")) return;
        try {
            const token = localStorage.getItem('bariplus_admin_token');
            const apiUrl = process.env.REACT_APP_API_URL;
            const res = await fetch(`${apiUrl}/api/admin/conteudos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Falha ao apagar conteúdo.");
            toast.success("Conteúdo apagado com sucesso!");
            fetchConteudos();
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="admin-page-container">
            <header className="page-header-actions">
                <div className="page-header">
                    <h1>Gestão de Conteúdo</h1>
                    <p>Crie, edite e gira todos os artigos e receitas do aplicativo.</p>
                </div>
                <Link to="/content/new" className="primary-btn">
                    + Criar Novo Conteúdo
                </Link>
            </header>

            <Card>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Tipo</th>
                                <th>Status</th>
                                <th>Data de Criação</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conteudos.length > 0 ? (
                                conteudos.map(item => (
                                    <tr key={item._id}>
                                        <td>{item.titulo}</td>
                                        <td><span className="type-badge">{item.tipo}</span></td>
                                        <td>
                                            <span className={`status-badge ${item.publicado ? 'published' : 'draft'}`}>
                                                {item.publicado ? 'Publicado' : 'Rascunho'}
                                            </span>
                                        </td>
                                        <td>{format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</td>
                                        <td className="actions-cell">
                                            <button onClick={() => navigate(`/content/edit/${item._id}`)} className="action-btn edit-btn">Editar</button>
                                            <button onClick={() => handleDelete(item._id)} className="action-btn delete-btn">Apagar</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="empty-cell">Nenhum conteúdo criado ainda.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ContentListPage;