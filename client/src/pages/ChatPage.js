// client/src/pages/ChatPage.js
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ChatBox from '../components/chat/ChatBox';

const ChatPage = () => {
    // ✅ CORREÇÃO: Recebe o utilizador diretamente do Layout
    const { user } = useOutletContext();

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Chat com Nutricionista</h1>
                <p>Envie mensagens e tire dúvidas diretamente com o seu profissional.</p>
            </div>

            {user?.nutricionistaId ? (
                // Passa o utilizador atual (paciente) e o destinatário (nutricionista)
                <ChatBox currentUser={user} receiver={user.nutricionistaId} />
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