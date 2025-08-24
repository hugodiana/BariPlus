import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ChatBox from '../components/chat/ChatBox';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchApi } from '../utils/api';
import { toast } from 'react-toastify';

const ChatPage = () => {
    const { user } = useOutletContext();
    const [nutricionista, setNutricionista] = useState(null);
    const [loadingNutri, setLoadingNutri] = useState(true);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(true);

    // Efeito para buscar detalhes do nutricionista
    useEffect(() => {
        const getNutricionistaDetails = async () => {
            if (user?.nutricionistaId) {
                try {
                    const nutriData = await fetchApi(`/api/public/nutri/${user.nutricionistaId._id}`);
                    setNutricionista(nutriData);
                } catch (error) {
                    console.error("Erro ao buscar detalhes do nutricionista:", error);
                    toast.error("Erro ao carregar dados do nutricionista.");
                } finally {
                    setLoadingNutri(false);
                }
            } else {
                setLoadingNutri(false);
            }
        };

        getNutricionistaDetails();
    }, [user?.nutricionistaId]);

    // Efeito para buscar mensagens da conversa
    useEffect(() => {
        const getConversationMessages = async () => {
            if (user?.nutricionistaId) { // Só busca se houver nutricionista vinculado
                try {
                    const conversationData = await fetchApi('/api/conversation');
                    setMessages(conversationData?.messages || []);
                } catch (error) {
                    console.error("Erro ao buscar mensagens:", error);
                    toast.error("Erro ao carregar mensagens.");
                } finally {
                    setLoadingMessages(false);
                }
            } else {
                setLoadingMessages(false);
            }
        };

        getConversationMessages();
    }, [user?.nutricionistaId]); // Depende do nutricionista para garantir que a conversa é relevante

    const handleSendMessage = async (messageContent) => {
        try {
            // Assumindo que o endpoint para enviar mensagem é /api/messages/send/:receiverId
            // E que o receiverId é o ID do nutricionista
            const sentMessage = await fetchApi(`/api/messages/send/${nutricionista._id}`, {
                method: 'POST',
                body: JSON.stringify({ content: messageContent })
            });
            // Atualiza a lista de mensagens com a nova mensagem
            setMessages(prevMessages => [...prevMessages, sentMessage]);
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            toast.error("Erro ao enviar mensagem.");
        }
    };

    if (loadingNutri || loadingMessages) {
        return <LoadingSpinner fullPage={false} />;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Chat com Nutricionista</h1>
                <p>Envie mensagens e tire dúvidas diretamente com o seu profissional.</p>
            </div>

            {nutricionista ? (
                <ChatBox recipient={nutricionista} messages={messages} onSendMessage={handleSendMessage} />
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