// src/components/paciente/ChatTab.js
import React from 'react';
import ChatBox from '../chat/ChatBox';

const ChatTab = ({ paciente, nutricionista }) => {
    return (
        <div>
            <div className="card-header-action">
                <h3>Conversa Direta</h3>
            </div>
            <p>Envie mensagens e tire dúvidas diretamente com {paciente.nome}. As mensagens trocadas aqui também aparecerão no aplicativo do paciente.</p>
            
            {/* O componente ChatBox já tem toda a lógica de que precisamos */}
            <ChatBox currentUser={nutricionista} receiver={paciente} />
        </div>
    );
};

export default ChatTab;