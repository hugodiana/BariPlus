// src/pages/ConvitePage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './ConvitePage.css'; // Vamos criar este ficheiro

const ConvitePage = () => {
    const { codigo } = useParams();
    const navigate = useNavigate();
    const [nutricionista, setNutricionista] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchConvite = useCallback(async () => {
        try {
            const data = await fetchApi(`/api/convites/${codigo}`);
            setNutricionista(data.nutricionista);
        } catch (err) {
            setError(err.message || 'Convite inválido ou expirado.');
            toast.error(err.message || 'Convite inválido ou expirado.');
        } finally {
            setLoading(false);
        }
    }, [codigo]);

    useEffect(() => {
        fetchConvite();
    }, [fetchConvite]);

    const handleAccept = async () => {
        setLoading(true);
        try {
            // A rota /api/convites/aceitar é protegida, então o fetchApi enviará o token do paciente logado
            const data = await fetchApi('/api/convites/aceitar', {
                method: 'POST',
                body: JSON.stringify({ codigo })
            });
            toast.success(data.message);
            navigate('/'); // Redireciona para a dashboard após aceitar
        } catch (err) {
            toast.error(err.message || 'Não foi possível aceitar o convite.');
            setLoading(false);
        }
    };

    return (
        <div className="convite-page-container">
            <Card className="convite-card">
                <img src="/bariplus_logo.png" alt="BariPlus Logo" className="convite-logo" />
                {loading && <LoadingSpinner />}
                
                {!loading && nutricionista && (
                    <>
                        <h2>Convite Recebido</h2>
                        <p>O(A) nutricionista</p>
                        <strong className="nutri-name">{nutricionista.nome}</strong>
                        <p>convidou você para se juntar à sua rede de pacientes no BariPlus.</p>
                        <p className="info">Ao aceitar, ele(a) terá acesso aos seus registos de progresso e diário alimentar para um acompanhamento mais próximo.</p>
                        <button className="accept-btn" onClick={handleAccept}>Aceitar Convite</button>
                    </>
                )}

                {!loading && error && (
                    <>
                        <h2>Erro no Convite</h2>
                        <p>{error}</p>
                        <button className="accept-btn" onClick={() => navigate('/login')}>Ir para o Login</button>
                    </>
                )}
            </Card>
        </div>
    );
};

export default ConvitePage;