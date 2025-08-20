// src/pages/AdminPacientesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchAdminApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminPages.css';

const AdminPacientesPage = () => {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    // CORREÇÃO: Removidos os setters não utilizados para limpar os avisos.
    const [pagina] = useState(1); 
    const [termoBusca, setTermoBusca] = useState('');

    const fetchPacientes = useCallback(async (paginaAtual, busca) => {
        setLoading(true);
        try {
            const data = await fetchAdminApi(`/api/admin/users?page=${paginaAtual}&search=${busca}`);
            setPacientes(data.users);
            // setTotalPaginas(data.pages); // Esta linha foi removida pois a variável não era usada.
        } catch (error) {
            toast.error("Erro ao carregar pacientes.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPacientes(pagina, termoBusca);
        }, 500);
        return () => clearTimeout(timer);
    }, [pagina, termoBusca, fetchPacientes]);

    const handleAccessChange = async (userId, grant = true) => {
        const endpoint = grant ? `/api/admin/grant-access/${userId}` : `/api/admin/users/${userId}/revoke-access`;
        const actionText = grant ? 'conceder' : 'revogar';
        try {
            await fetchAdminApi(endpoint, { method: 'POST' });
            toast.success(`Acesso ${grant ? 'concedido' : 'revogado'} com sucesso!`);
            fetchPacientes(pagina, termoBusca);
        } catch (error) {
            toast.error(`Erro ao ${actionText} acesso.`);
        }
    };
    
    // Função segura para formatar a data
    const formatarDataSegura = (data) => {
        try {
            return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            return 'Data inválida'; // Retorna um texto amigável em caso de erro
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gestão de Pacientes</h1>
            </div>
            <Card>
                <input 
                    type="text" 
                    placeholder="Buscar por nome, email ou username..." 
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="search-input"
                />
                <div className="admin-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Status Pagamento</th>
                                <th>Data de Registo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pacientes.map(user => (
                                <tr key={user._id}>
                                    <td>{user.nome} {user.sobrenome}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`status-badge ${user.pagamentoEfetuado ? 'pago' : 'pendente'}`}>
                                            {user.pagamentoEfetuado ? 'Ativo' : 'Pendente'}
                                        </span>
                                    </td>
                                    {/* CORREÇÃO: Usa a nova função de formatação segura */}
                                    <td>{formatarDataSegura(user.createdAt)}</td>
                                    <td className="actions-cell">
                                        {user.pagamentoEfetuado ? (
                                            <button className="action-btn danger" onClick={() => handleAccessChange(user._id, false)}>Revogar</button>
                                        ) : (
                                            <button className="action-btn success" onClick={() => handleAccessChange(user._id, true)}>Conceder</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminPacientesPage;