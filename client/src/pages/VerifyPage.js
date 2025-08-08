import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/ui/Card';

const VerifyPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verificando'); // 'verificando' | 'sucesso' | 'erro'
  const [message, setMessage] = useState('');
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!token) {
      setStatus('erro');
      setMessage('Token não fornecido.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json' // pede preferencialmente JSON ao servidor
          },
          // redirect: 'follow' // padrão é 'follow'
        });

        // se o servidor retornou JSON -> parse com segurança
        const contentType = (res.headers.get('content-type') || '').toLowerCase();

        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Token inválido.');
          setStatus('sucesso');
          setMessage(data.message || 'E-mail verificado com sucesso.');
          return;
        }

        // se não for JSON, lê como texto (HTML ou mensagem do servidor)
        const text = await res.text();

        // se o status for 2xx, considera sucesso (mesmo vindo em HTML)
        if (res.ok) {
          // tenta extrair texto limpo do HTML (retira tags) para mostrar algo útil
          const plain = text.replace(/<[^>]+>/g, '').trim().slice(0, 600);
          setStatus('sucesso');
          setMessage(plain || 'E-mail verificado (resposta HTML do servidor).');
          return;
        }

        // se não for ok (ex.: 302/4xx/5xx) -> extrai um snippet legível e lança erro
        const snippet = text.replace(/<[^>]+>/g, '').trim().slice(0, 600) || `Erro do servidor: ${res.status}`;
        throw new Error(snippet);

      } catch (err) {
        console.error('Erro ao verificar token:', err);
        setStatus('erro');
        setMessage(err?.message || 'Erro ao verificar o e-mail.');
      }
    };

    verifyToken();
  }, [token, apiUrl]);

  return (
    <div className="status-page-container">
      <Card className="status-card">
        {status === 'verificando' && <LoadingSpinner message="Verificando o seu e-mail..." />}
        {status === 'sucesso' && (
          <>
            <div className="status-icon success"><span>✓</span></div>
            <h1>E-mail Verificado!</h1>
            <p>{message}</p>
            <Link to="/login" className="status-button">Ir para o Login</Link>
          </>
        )}
        {status === 'erro' && (
          <>
            <div className="status-icon error"><span>×</span></div>
            <h1>Erro na Verificação</h1>
            <p>{message}</p>
            <Link to="/login" className="status-button">Voltar para o Login</Link>
          </>
        )}
      </Card>
    </div>
  );
};

export default VerifyPage;
