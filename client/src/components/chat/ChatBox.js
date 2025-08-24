import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, InputGroup } from 'react-bootstrap';

const ChatBox = ({ recipient, messages, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Card className="h-100 d-flex flex-column">
            <Card.Header className="d-flex align-items-center p-3">
                <img src={recipient.fotoPerfilUrl || 'https://i.imgur.com/V4RclNb.png'} alt={recipient.nome} className="rounded-circle me-2" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                <h5 className="mb-0">{recipient.nome}</h5>
            </Card.Header>
            <Card.Body className="flex-grow-1 overflow-auto p-3">
                <div className="d-flex flex-column">
                    {messages.map((msg, index) => (
                        <div key={index} className={`d-flex mb-2 ${msg.senderId === recipient._id ? 'justify-content-start' : 'justify-content-end'}`}>
                            <div className={`p-2 rounded ${msg.senderId === recipient._id ? 'bg-light text-dark' : 'bg-primary text-white'}`} style={{ maxWidth: '75%' }}>
                                {msg.content}
                                <div className="text-end mt-1" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </Card.Body>
            <Card.Footer className="p-3">
                <InputGroup>
                    <Form.Control
                        as="textarea"
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ maxHeight: '100px', minHeight: '38px' }}
                    />
                    <Button variant="primary" onClick={handleSendMessage}>
                        Enviar
                    </Button>
                </InputGroup>
            </Card.Footer>
        </Card>
    );
};

export default ChatBox;