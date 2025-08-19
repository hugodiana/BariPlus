// src/components/chat/ChatBox.js
import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../utils/api';
import './ChatBox.css';

const ChatBox = ({ currentUser, receiver, onNewMessage }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchConversation = async () => {
            try {
                // A rota para o nutri buscar a conversa é diferente da do paciente
                const endpoint = currentUser.crn 
                    ? `/api/nutri/pacientes/${receiver._id}/conversation` 
                    : `/api/pacientes/${receiver._id}/conversation`; // Assumindo que esta rota existirá para o paciente

                const conversation = await fetchApi(endpoint);
                setMessages(conversation.messages || []);
            } catch (error) {
                console.error("Erro ao carregar mensagens:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConversation();
    }, [currentUser.crn, receiver._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const tempId = Date.now();
        const sentMessage = {
            _id: tempId,
            senderId: currentUser.id,
            content: newMessage,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');

        try {
            const data = await fetchApi(`/api/messages/send/${receiver._id}`, {
                method: 'POST',
                body: JSON.stringify({ content: newMessage })
            });
            // Atualiza a mensagem temporária com os dados reais do servidor
            setMessages(prev => prev.map(msg => msg._id === tempId ? data : msg));
            if(onNewMessage) onNewMessage(data);
        } catch (error) {
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
        }
    };
    
    if (loading) return <p>A carregar chat...</p>;

    return (
        <div className="chat-box">
            <div className="messages-container">
                {messages.map((msg) => (
                    <div key={msg._id} className={`message ${msg.senderId === currentUser.id ? 'sent' : 'received'}`}>
                        <p>{msg.content}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escreva uma mensagem..."
                />
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
};

export default ChatBox;