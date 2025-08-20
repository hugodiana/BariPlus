// src/pages/AdminNutricionistasPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
// --- CORREÇÃO: Importa o componente Link ---
import { Link } from 'react-router-dom';
import { fetchAdminApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminPages.css';

const AdminNutricionistasPage = () => {
    const [nutricionistas, setNutricionistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [termoBusca, setTermoBusca] = useState('');

    const fetchNutricionistas = useCallback(async (paginaAtual, busca) => {
        setLoading(true);
        try {
            const data = await fetchAdminApi(`/api/admin/nutricionistas?page=${paginaAtual}&search=${busca}`);
            setNutricionistas(data.nutricionistas);
            setTotalPaginas(data.pages);
        } catch (error) {
            toast.error("Erro ao carregar nutricionistas.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchNutricionistas(pagina, termoBusca);
        }, 500);
        return () => clearTimeout(timer);
    }, [pagina, termoBusca, fetchNutricionistas]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gestão de Nutricionistas</h1>
            </div>
            <Card>
                <input 
                    type="text" 
                    placeholder="Buscar por nome, email ou CRN..." 
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
                                <th>CRN</th>
                                <th>Plano</th>
                                <th>Status Assinatura</th>
                                <th>Pacientes</th>
                                {/* --- CORREÇÃO: Nova coluna de Ações --- */}
                                <th>Ações</th>
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
                                    {/* --- CORREÇÃO: Nova célula com o botão/link --- */}
                                    <td className="actions-cell">
                                        <Link to={`/nutricionistas/${nutri._id}`} className="action-btn">
                                            Ver Detalhes
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination-controls">
                    <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>
                        Anterior
                    </button>
                    <span>Página {pagina} de {totalPaginas}</span>
                    <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>
                        Próxima
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default AdminNutricionistasPage;