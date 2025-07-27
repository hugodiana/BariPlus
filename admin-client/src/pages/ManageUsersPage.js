import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './ManageUsersPage.css'; // Vamos criar este CSS

const ManageUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [pendingAffiliates, setPendingAffiliates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewFilter, setViewFilter] = useState('all'); // 'all' ou 'pending'

    // Estados para o modal de aprovação
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [userToApprove, setUserToApprove] = useState(null);
    const [couponCode, setCouponCode] = useState('');

    const token = localStorage.getItem('bariplus_admin_token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, pendingRes] = await Promise.all([
                fetch(`${apiUrl}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiUrl}/api/admin/pending-affiliates`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!usersRes.ok || !pendingRes.ok) throw new Error('Erro ao carregar dados dos usuários.');
            
            const usersData = await usersRes.json();
            const pendingData = await pendingRes.json();
            
            setUsers(usersData.users || usersData);
            setPendingAffiliates(pendingData);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGrantAccess = async (userId) => {
        if (!window.confirm("Tem certeza que quer liberar o acesso para este usuário?")) return;
        try {
            const response = await fetch(`${apiUrl}/api/admin/grant-access/${userId}`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao liberar acesso');
            
            toast.success('Acesso liberado com sucesso!');
            fetchData(); // Recarrega os dados
        } catch (err) {
            toast.error(err.message);
        }
    };

    const openApproveModal = (profile) => {
        setUserToApprove(profile);
        setCouponCode(profile.userId.username.toUpperCase().replace(/[^A-Z0-9]/g, ''));
        setIsApproveModalOpen(true);
    };

    const handleApproveAffiliate = async (e) => {
        e.preventDefault();
        if (!couponCode) return toast.error('O código do cupom é obrigatório');
        try {
            const response = await fetch(`${apiUrl}/api/admin/approve-affiliate/${userToApprove.userId._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ couponCode })
            });
            if (!response.ok) throw new Error('Falha ao aprovar afiliado');
            
            toast.success(`Afiliado aprovado com sucesso!`);
            setIsApproveModalOpen(false);
            fetchData(); // Recarrega os dados
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) {
        return <div className="loading-state">Carregando usuários...</div>;
    }

    const listToRender = viewFilter === 'all' ? users : pendingAffiliates;

    return (
        <div className="admin-page-container">
            <h1 className="page-title">Gestão de Usuários</h1>
            <div className="table-header">
                <p className="page-subtitle">Visualize e administre todos os usuários e candidaturas.</p>
                <div className="view-filters">
                    <button className={viewFilter === 'all' ? 'active' : ''} onClick={() => setViewFilter('all')}>Todos ({users.length})</button>
                    <button className={viewFilter === 'pending' ? 'active' : ''} onClick={() => setViewFilter('pending')}>
                        Candidaturas ({pendingAffiliates.length})
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                {viewFilter === 'all' && (
                    <table>
                        <thead><tr><th>Nome</th><th>Email</th><th>Função</th><th>Pagamento</th><th>Ações</th></tr></thead>
                        <tbody>
                            {listToRender.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.nome} {user.sobrenome}</td>
                                    <td>{user.email}</td>
                                    <td><span className={`badge ${user.role}`}>{user.role}</span></td>
                                    <td>{user.pagamentoEfetuado ? <span className="badge success">Ativo</span> : <span className="badge warning">Pendente</span>}</td>
                                    <td className="actions">{!user.pagamentoEfetuado && (<button onClick={() => handleGrantAccess(user._id)} className="btn-primary">Liberar</button>)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {viewFilter === 'pending' && (
                    <table>
                         <thead><tr><th>Nome</th><th>Contato</th><th>Chave Pix</th><th>Ações</th></tr></thead>
                         <tbody>
                            {listToRender.map((profile) => (
                                <tr key={profile._id}>
                                    <td>{profile.userId.nome} {profile.userId.sobrenome}</td>
                                    <td>{profile.whatsapp}</td>
                                    <td>{profile.pixKeyType}: {profile.pixKey}</td>
                                    <td className="actions"><button onClick={() => openApproveModal(profile)} className="btn-approve">Aprovar</button></td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Aprovar Novo Afiliado">
                {userToApprove && (
                    <form onSubmit={handleApproveAffiliate} className="modal-form">
                        <p>Candidato: <strong>{userToApprove.userId.nome} {userToApprove.userId.sobrenome}</strong></p>
                        <p><strong>PIX:</strong> {userToApprove.pixKey}</p>
                        <div className="form-group">
                            <label>Código do Cupom (30% desc.)</label>
                            <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} required />
                        </div>
                        <p className="modal-info">Lembre-se de criar este cupom manualmente no seu painel do Mercado Pago.</p>
                        <div className="form-actions">
                            <button type="button" onClick={() => setIsApproveModalOpen(false)} className="btn-cancel">Cancelar</button>
                            <button type="submit" className="btn-confirm">Confirmar Aprovação</button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default ManageUsersPage;