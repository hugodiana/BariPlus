import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './UsersListPage.css';

const UsersListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const token = localStorage.getItem('bariplus_admin_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchUsers = useCallback(async (currentPage, currentSearch) => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/admin/users?page=${currentPage}&limit=15&search=${currentSearch}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Falha ao carregar usuários.");
            const data = await res.json();
            setUsers(data.users);
            setTotalPages(data.pages);
            setPage(data.currentPage);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        const timer = setTimeout(() => { fetchUsers(1, search); }, 500);
        return () => clearTimeout(timer);
    }, [search, fetchUsers]);

    useEffect(() => {
        // A busca já chama a primeira página, este só deve ser chamado para paginação
        if (page > 1) {
            fetchUsers(page, search);
        }
    }, [page]);
    
    const handleAction = async (action, userId, confirmMessage) => {
        if (!window.confirm(confirmMessage)) return;
        
        let url = '';
        if (action === 'grant-access') {
            url = `${apiUrl}/api/admin/grant-access/${userId}`;
        } else {
            url = `${apiUrl}/api/admin/users/${userId}/${action}`;
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Falha ao executar a ação.`);
            toast.success("Ação executada com sucesso!");
            fetchUsers(page, search);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="users-list-page">
            <header className="page-header">
                <h1>Gerenciamento de Usuários</h1>
                <p>Veja e gerencie todos os usuários cadastrados no BariPlus.</p>
            </header>
            <div className="users-table-controls">
                <input type="text" placeholder="Buscar por nome, e-mail ou username..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
            </div>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Status Pagamento</th>
                            <th>E-mail Verificado</th>
                            <th>Data de Cadastro</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6">A carregar...</td></tr>
                        ) : users.length > 0 ? (
                            users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.nome} {user.sobrenome}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`status-badge ${user.pagamentoEfetuado ? 'status-pago' : 'status-pendente'}`}>{user.pagamentoEfetuado ? 'Pago' : 'Pendente'}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.isEmailVerified ? 'status-pago' : 'status-pendente'}`}>{user.isEmailVerified ? 'Verificado' : 'Pendente'}</span>
                                    </td>
                                    <td>{user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</td>
                                    <td className="actions-cell">
                                        {!user.pagamentoEfetuado && <button onClick={() => handleAction('grant-access', user._id, "Conceder acesso?")} className="action-btn grant-btn">Conceder Acesso</button>}
                                        {user.pagamentoEfetuado && <button onClick={() => handleAction('revoke-access', user._id, "Revogar acesso?")} className="action-btn delete-btn">Revogar Acesso</button>}
                                        {!user.isEmailVerified && <button onClick={() => handleAction('verify-email', user._id, "Confirmar e-mail?")} className="action-btn edit-btn">Confirmar E-mail</button>}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6">Nenhum usuário encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="pagination-controls">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</button>
                <span>Página {page} de {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Próxima</button>
            </div>
        </div>
    );
};

export default UsersListPage;