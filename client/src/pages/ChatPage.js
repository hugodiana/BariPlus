// src/pages/ChatPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ChatBox from '../components/chat/ChatBox';

const ChatPage = () => {
    const [usuario, setUsuario] = useState(null);
    const [nutricionista, setNutricionista] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const userData = await fetchApi('/api/me');
            setUsuario(userData);
            if (userData.nutricionistaId) {
                // Se o utilizador tem um nutri vinculado, buscamos os detalhes dele
                // (Precisaremos de uma nova rota para isso, por agora vamos usar um nome placeholder)
                // Vamos assumir que a rota /api/me já popula os dados do nutri
                setNutricionista(userData.nutricionistaId); 
            }
        } catch (error) {
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Chat com Nutricionista</h1>
                <p>Envie mensagens e tire dúvidas diretamente com o seu profissional.</p>
            </div>

            {nutricionista ? (
                <ChatBox currentUser={usuario} receiver={nutricionista} />
            ) : (
                <EmptyState
                    title="Nenhum Nutricionista Vinculado"
                    message="Você ainda não está conectado a um nutricionista. Aceite um convite para começar a conversar."
                />
            )}
        </div>
    );
};

export default ChatPage;