import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import './BuscaAlimentos.css'; // Vamos criar este CSS a seguir

const BuscaAlimentos = ({ onSelectAlimento }) => {
    const [termoBusca, setTermoBusca] = useState('');
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Digite 3 ou mais letras para começar a busca.');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    // Função de busca com debounce
    const buscarAlimentos = useCallback(async (query) => {
        if (query.length < 3) {
            setResultados([]);
            setMessage('Digite 3 ou mais letras para começar a busca.');
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const response = await fetch(`${apiUrl}/api/taco/buscar?q=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro na busca.');
            const data = await response.json();
            setResultados(data);
            if (data.length === 0) {
                setMessage(`Nenhum resultado para "${query}".`);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, token]);

    // Efeito para chamar a busca com debounce (atraso)
    useEffect(() => {
        const timer = setTimeout(() => {
            buscarAlimentos(termoBusca);
        }, 500); // Espera 500ms após o usuário parar de digitar

        return () => clearTimeout(timer);
    }, [termoBusca, buscarAlimentos]);

    return (
        <div className="busca-alimentos-container">
            <input
                type="text"
                className="busca-input"
                placeholder="Digite o nome de um alimento..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                autoFocus
            />
            {loading && <p className="info-message">A buscar...</p>}
            {resultados.length > 0 ? (
                <ul className="resultados-lista">
                    {resultados.map((alimento, index) => (
                        <li key={`${alimento.description}-${index}`} onClick={() => onSelectAlimento(alimento)}>
                            <div className="alimento-nome">{alimento.description}</div>
                            <div className="alimento-macros">
                                <span><strong>Kcal:</strong> {alimento.kcal.toFixed(0)}</span>
                                <span><strong>P:</strong> {alimento.protein.toFixed(1)}g</span>
                                <span><strong>C:</strong> {alimento.carbohydrates.toFixed(1)}g</span>
                                <span><strong>G:</strong> {alimento.lipids.toFixed(1)}g</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                !loading && <p className="info-message">{message}</p>
            )}
        </div>
    );
};

export default BuscaAlimentos;