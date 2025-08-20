// src/pages/AdminNutricionistasPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { fetchAdminApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminPages.css';


const AdminNutricionistasPage = () => {
    const [nutricionistas, setNutricionistas] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNutricionistas = useCallback(async () => {
        try {
            const data = await fetchAdminApi('/api/admin/nutricionistas');
            setNutricionistas(data);
        } catch (error) {
            toast.error("Erro ao carregar nutricionistas.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNutricionistas();
    }, [fetchNutricionistas]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gestão de Nutricionistas</h1>
            </div>
            <Card>
                <div className="admin-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>CRN</th>
                                <th>Plano</th>
                                <th>Status Assinatura</th>
                                <th>Pacientes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nutricionistas.map(nutri => (
                                <tr key={nutri._id}>
                                    <td>{nutri.nome}</td>
                                    <td>{nutri.email}</td>
                                    <td>{nutri.crn}</td>
                                    <td>{nutri.assinatura.plano || 'N/A'}</td>
                                    <td>
                                        <span className={`status-badge ${nutri.assinatura.status}`}>
                                            {nutri.assinatura.status}
                                        </span>
                                    </td>
                                    <td>{(nutri.pacientesBariplus?.length || 0) + (nutri.pacientesLocais?.length || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminNutricionistasPage;