// src/pages/AdminConteudosPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchAdminApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ConteudoFormModal from '../components/ConteudoFormModal'; // ✅ 1. IMPORTAR O MODAL
import './AdminPages.css';

const AdminConteudosPage = () => {
    const [conteudos, setConteudos] = useState([]);
    const [loading, setLoading] = useState(true);
    // ✅ 2. ESTADOS PARA CONTROLAR O MODAL
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    const fetchConteudos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAdminApi('/api/admin/conteudos');
            setConteudos(data);
        } catch (error) {
            toast.error("Erro ao carregar conteúdos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConteudos();
    }, [fetchConteudos]);

    const handleDelete = async (id) => {
        if (window.confirm("Tem a certeza que quer apagar este item?")) {
            try {
                await fetchAdminApi(`/api/admin/conteudos/${id}`, { method: 'DELETE' });
                toast.success("Conteúdo apagado com sucesso.");
                setConteudos(conteudosAtuais => conteudosAtuais.filter(item => item._id !== id));
            } catch (error) {
                toast.error("Erro ao apagar conteúdo.");
            }
        }
    };
    
    // ✅ 3. FUNÇÕES PARA ABRIR O MODAL
    const handleOpenAddModal = () => {
        setCurrentItem(null); // Garante que é para criar um novo
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item) => {
        setCurrentItem(item); // Define o item a ser editado
        setIsModalOpen(true);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header-action">
                <div className="page-header">
                    <h1>Gestão de Conteúdo</h1>
                    <p>Crie e edite os artigos e receitas para os seus utilizadores.</p>
                </div>
                {/* ✅ 4. O BOTÃO AGORA ABRE O MODAL */}
                <button className="action-btn-positive" onClick={handleOpenAddModal}>
                    + Novo Conteúdo
                </button>
            </div>
            <Card>
                <div className="admin-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Tipo</th>
                                <th>Status</th>
                                <th>Criado em</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conteudos.map(item => (
                                <tr key={item._id}>
                                    <td>{item.titulo}</td>
                                    <td>{item.tipo}</td>
                                    <td>
                                        <span className={`status-badge ${item.publicado ? 'ativa' : 'inativa'}`}>
                                            {item.publicado ? 'Publicado' : 'Rascunho'}
                                        </span>
                                    </td>
                                    <td>{format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</td>
                                    <td className="actions-cell">
                                        {/* ✅ 5. O BOTÃO AGORA ABRE O MODAL COM O ITEM */}
                                        <button className="action-btn success" onClick={() => handleOpenEditModal(item)}>Editar</button>
                                        <button className="action-btn danger" onClick={() => handleDelete(item._id)}>Apagar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ✅ 6. O MODAL É RENDERIZADO QUANDO isModalOpen É VERDADEIRO */}
            {isModalOpen && (
                <ConteudoFormModal 
                    item={currentItem} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={fetchConteudos} 
                />
            )}
        </div>
    );
};

export default AdminConteudosPage;