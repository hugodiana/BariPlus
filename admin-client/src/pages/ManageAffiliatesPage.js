import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './ManageAffiliatesPage.css'; // Vamos criar este CSS

const ManageAffiliatesPage = () => {
    const [affiliates, setAffiliates] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados do modal de pagamento
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [affiliateToPay, setAffiliateToPay] = useState(null);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutReceipt, setPayoutReceipt] = useState(null);

    const token = localStorage.getItem('bariplus_admin_token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const fetchAffiliates = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/admin/affiliates`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Erro ao buscar afiliados.');
            const data = await response.json();
            setAffiliates(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchAffiliates();
    }, [fetchAffiliates]);

    const openPayoutModal = (affiliate) => {
        setAffiliateToPay(affiliate);
        setIsPayoutModalOpen(true);
    };

    const handlePayoutSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('amount', payoutAmount);
        if (payoutReceipt) {
            formData.append('receipt', payoutReceipt);
        }
        try {
            await fetch(`${apiUrl}/api/admin/affiliate-payout/${affiliateToPay.profile._id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            toast.success("Pagamento de comissão registrado!");
            setIsPayoutModalOpen(false);
            setPayoutAmount('');
            setPayoutReceipt(null);
            fetchAffiliates(); // Recarrega os dados
        } catch (error) {
            toast.error("Erro ao registrar pagamento.");
        }
    };

    if (loading) return <div>Carregando afiliados...</div>;

    return (
        <div className="admin-page-container">
            <h1 className="page-title">Gestão de Afiliados</h1>
            <p className="page-subtitle">Acompanhe o desempenho e administre os pagamentos dos seus parceiros.</p>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Afiliado</th>
                            <th>Cupom</th>
                            <th>Vendas</th>
                            <th>Comissão Devida (30%)</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {affiliates.map(affiliate => {
                            const commissionDue = (affiliate.totalRevenueInCents * 0.30) / 100;
                            return (
                                <tr key={affiliate._id}>
                                    <td>{affiliate.nome}<br/><small>{affiliate.email}</small></td>
                                    <td><span className="coupon-badge">{affiliate.couponCode}</span></td>
                                    <td>{affiliate.salesCount}</td>
                                    <td>{commissionDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="actions">
                                        <button className="btn-primary" onClick={() => openPayoutModal(affiliate)}>Registrar Pagamento</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isPayoutModalOpen} onClose={() => setIsPayoutModalOpen(false)} title="Registrar Pagamento de Comissão">
                {affiliateToPay && (
                    <form onSubmit={handlePayoutSubmit} className="modal-form">
                        <p>Pagamento para: <strong>{affiliateToPay.nome}</strong></p>
                        <p><strong>Chave PIX:</strong> {affiliateToPay.profile.pixKey}</p>
                        <div className="form-group">
                            <label>Valor Pago (R$)</label>
                            <input type="number" step="0.01" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Comprovativo (Opcional)</label>
                            <input type="file" onChange={e => setPayoutReceipt(e.target.files[0])} />
                        </div>
                        <div className="form-actions">
                            <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="btn-cancel">Cancelar</button>
                            <button type="submit" className="btn-confirm">Confirmar Pagamento</button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};
export default ManageAffiliatesPage;