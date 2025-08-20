// src/pages/AdminNutricionistaDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchAdminApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminPages.css';

const DetailItem = ({ label, value }) => ( /* Reutilizando o componente */
    <div className="detail-item">
        <span className="detail-label">{label}</span>
        <span className="detail-value">{value || 'Não informado'}</span>
    </div>
);

const AdminNutricionistaDetailPage = () => {
    const { id } = useParams();
    const [nutri, setNutri] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchNutri = useCallback(async () => {
        try {
            const data = await fetchAdminApi(`/api/admin/nutricionistas/${id}`);
            setNutri(data);
        } catch (error) {
            toast.error("Erro ao carregar detalhes do nutricionista.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchNutri();
    }, [fetchNutri]);

    if (loading) return <LoadingSpinner />;
    if (!nutri) return <p>Nutricionista não encontrado.</p>;

    return (
        <div className="page-container">
            <Link to="/nutricionistas" className="back-link">‹ Voltar para a lista</Link>
            <div className="page-header">
                <h1>{nutri.nome}</h1>
                <p>CRN: {nutri.crn} | Email: {nutri.email}</p>
            </div>
            
            <div className="details-grid">
                <Card>
                    <h3>Detalhes da Assinatura</h3>
                    <DetailItem label="Plano" value={nutri.assinatura.plano} />
                    <DetailItem label="Status" value={nutri.assinatura.status} />
                    <DetailItem label="Limite de Pacientes" value={nutri.limiteGratis} />
                </Card>
                <Card>
                    <h3>Pacientes Vinculados</h3>
                    <h4>BariPlus ({nutri.pacientesBariplus.length})</h4>
                    <ul className="patient-list">
                        {nutri.pacientesBariplus.map(p => <li key={p._id}>{p.nome} {p.sobrenome}</li>)}
                    </ul>
                    <h4>Prontuário ({nutri.pacientesLocais.length})</h4>
                    <ul className="patient-list">
                        {nutri.pacientesLocais.map(p => <li key={p._id}>{p.nomeCompleto}</li>)}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default AdminNutricionistaDetailPage;