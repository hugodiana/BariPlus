import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './UsersListPage.css';
// ✅ A importação 'fetchApi' que causava o erro foi removida.

const UsersListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const token = localStorage.getItem('bariplus_admin_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchUsers = useCallback(async (currentPage, currentSearch, currentFilter) => {
        setLoading(true);
        try {
            // ✅ CORREÇÃO: Voltamos a usar o fetch padrão com o cabeçalho de autorização.
            const res = await fetch(`${apiUrl}/api/admin/users?page=${currentPage}&limit=15&search=${currentSearch}&status=${currentFilter}`, {
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
    }, [apiUrl, token]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(1, search, filter);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, filter, fetchUsers]);

    const handleAction = async (action, userId, confirmMessage) => {
        if (!window.confirm(confirmMessage)) return;
        
        try {
            const url = action === 'grant-access' 
                ? `${apiUrl}/api/admin/grant-access/${userId}` 
                : `${apiUrl}/api/admin/users/${userId}/${action}`;
            
            // ✅ CORREÇÃO: Usamos o fetch padrão aqui também.
            const res = await fetch(url, { 
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(`Falha ao executar a ação.`);
            toast.success("Ação executada com sucesso!");
            fetchUsers(page, search, filter);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="admin-page-container">
            <header className="page-header">
                <h1>Gerenciamento de Usuários</h1>
                <p>Veja e gerencie todos os usuários cadastrados no BariPlus.</p>
            </header>

            <div className="table-controls">
                <input 
                    type="text" 
                    placeholder="Buscar por nome, e-mail ou username..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="search-input" 
                />
                <div className="filter-buttons">
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todos</button>
                    <button className={filter === 'paid' ? 'active' : ''} onClick={() => setFilter('paid')}>Pagos</button>
                    <button className={filter === 'pending_payment' ? 'active' : ''} onClick={() => setFilter('pending_payment')}>Pag. Pendente</button>
                    <button className={filter === 'pending_verification' ? 'active' : ''} onClick={() => setFilter('pending_verification')}>Email Pendente</button>
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail / Username</th>
                            <th>Pagamento</th>
                            <th>E-mail</th>
                            <th>Data de Cadastro</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="loading-cell">A carregar...</td></tr>
                        ) : users.length > 0 ? (
                            users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.nome} {user.sobrenome}</td>
                                    <td>{user.email}<br/><small>{user.username}</small></td>
                                    <td><span className={`status-badge ${user.pagamentoEfetuado ? 'paid' : 'pending'}`}>{user.pagamentoEfetuado ? 'Pago' : 'Pendente'}</span></td>
                                    <td><span className={`status-badge ${user.isEmailVerified ? 'verified' : 'pending'}`}>{user.isEmailVerified ? 'Verificado' : 'Pendente'}</span></td>
                                    <td>{user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</td>
                                    <td className="actions-cell">
                                        {!user.pagamentoEfetuado && <button onClick={() => handleAction('grant-access', user._id, "Conceder acesso?")} className="action-btn grant-btn">Conceder</button>}
                                        {user.pagamentoEfetuado && <button onClick={() => handleAction('revoke-access', user._id, "Revogar acesso?")} className="action-btn revoke-btn">Revogar</button>}
                                        {!user.isEmailVerified && <button onClick={() => handleAction('verify-email', user._id, "Confirmar e-mail?")} className="action-btn verify-btn">Verificar</button>}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="empty-cell">Nenhum usuário encontrado para este filtro.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="pagination-controls">
                <button onClick={() => fetchUsers(page - 1, search, filter)} disabled={page <= 1}>Anterior</button>
                <span>Página {page} de {totalPages}</span>
                <button onClick={() => fetchUsers(page + 1, search, filter)} disabled={page >= totalPages}>Próxima</button>
            </div>
        </div>
    );
};

export default UsersListPage;