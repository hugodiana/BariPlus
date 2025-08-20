// src/pages/AdminPacienteDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchAdminApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminPages.css';

const DetailItem = ({ label, value }) => (
    <div className="detail-item">
        <span className="detail-label">{label}</span>
        <span className="detail-value">{value || 'Não informado'}</span>
    </div>
);

const AdminPacienteDetailPage = () => {
    const { id } = useParams();
    const [paciente, setPaciente] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPaciente = useCallback(async () => {
        try {
            const data = await fetchAdminApi(`/api/admin/users/${id}`);
            setPaciente(data);
        } catch (error) {
            toast.error("Erro ao carregar detalhes do paciente.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPaciente();
    }, [fetchPaciente]);

    if (loading) return <LoadingSpinner />;
    if (!paciente) return <p>Paciente não encontrado.</p>;

    return (
        <div className="page-container">
            <Link to="/pacientes" className="back-link">‹ Voltar para a lista</Link>
            <div className="page-header">
                <h1>{paciente.nome} {paciente.sobrenome}</h1>
                <p>Email: {paciente.email}</p>
            </div>

            <div className="details-grid">
                <Card>
                    <h3>Informações Gerais</h3>
                    <DetailItem label="Username" value={paciente.username} />
                    <DetailItem label="Data de Registo" value={format(new Date(paciente.createdAt), 'dd/MM/yyyy', { locale: ptBR })} />
                    <DetailItem label="Status do Pagamento" value={paciente.pagamentoEfetuado ? 'Ativo' : 'Pendente'} />
                    <DetailItem label="Onboarding Completo" value={paciente.onboardingCompleto ? 'Sim' : 'Não'} />
                </Card>
                 <Card>
                    <h3>Nutricionista Vinculado</h3>
                    <DetailItem label="Nome do Profissional" value={paciente.nutricionistaId?.nome} />
                    <DetailItem label="CRN" value={paciente.nutricionistaId?.crn} />
                </Card>
            </div>
        </div>
    );
};

export default AdminPacienteDetailPage;