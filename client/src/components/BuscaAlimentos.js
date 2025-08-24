import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Form, Spinner, ListGroup } from 'react-bootstrap'; // Importar componentes do react-bootstrap

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
        <div className="mb-3">
            <Form.Control
                type="text"
                placeholder="Digite o nome de um alimento..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                autoFocus
                className="mb-3"
            />
            {loading && <p className="text-info">A buscar... <Spinner animation="border" size="sm" /></p>}
            {resultados.length > 0 ? (
                <ListGroup className="resultados-lista">
                    {resultados.map((alimento, index) => (
                        <ListGroup.Item action onClick={() => onSelectAlimento(alimento)} key={`${alimento.description}-${index}`}>
                            <div className="fw-bold mb-1">{alimento.description}</div>
                            <div className="d-flex justify-content-between flex-wrap small text-muted">
                                <span><strong>Kcal:</strong> {alimento.kcal.toFixed(0)}</span>
                                <span><strong>P:</strong> {alimento.protein.toFixed(1)}g</span>
                                <span><strong>C:</strong> {alimento.carbohydrates.toFixed(1)}g</span>
                                <span><strong>G:</strong> {alimento.lipids.toFixed(1)}g</span>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            ) : (
                !loading && <p className="text-muted">{message}</p>
            )}
        </div>
    );
};

export default BuscaAlimentos;