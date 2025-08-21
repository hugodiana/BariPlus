// src/components/BuscaAlimentos.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import './BuscaAlimentos.css';

const BuscaAlimentos = ({ onSelectAlimento }) => {
    const [termoBusca, setTermoBusca] = useState('');
    const [resultados, setResultados] = useState([]);
    const [meusAlimentos, setMeusAlimentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Digite 3+ letras para buscar.');

    // Carrega os alimentos personalizados uma vez
    useEffect(() => {
        const fetchMeusAlimentos = async () => {
            try {
                const nutriData = await fetchApi('/api/nutri/auth/me');
                setMeusAlimentos(nutriData.alimentosPersonalizados || []);
            } catch (error) {
                console.error("Não foi possível carregar alimentos personalizados.");
            }
        };
        fetchMeusAlimentos();
    }, []);

    const buscarAlimentos = useCallback(async (query) => {
        if (query.length < 3) {
            setResultados([]);
            setMessage('Digite 3+ letras para buscar.');
            return;
        }
        setLoading(true);
        setMessage('');

        try {
            // Busca na API da TACO
            const tacoResults = await fetchApi(`/api/taco/buscar?q=${query}`);
            
            // Filtra os alimentos personalizados localmente
            const personalizadosFiltrados = meusAlimentos.filter(
                a => a.description.toLowerCase().includes(query.toLowerCase())
            );

            const allResults = [...personalizadosFiltrados, ...tacoResults];
            setResultados(allResults);
            
            if (allResults.length === 0) {
                setMessage(`Nenhum resultado para "${query}".`);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [meusAlimentos]);

    useEffect(() => {
        const timer = setTimeout(() => {
            buscarAlimentos(termoBusca);
        }, 500);
        return () => clearTimeout(timer);
    }, [termoBusca, buscarAlimentos]);

    return (
        <div className="busca-alimentos-container">
            <input
                type="text" className="busca-input" placeholder="Buscar na Tabela TACO ou em 'Meus Alimentos'..."
                value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} autoFocus
            />
            {loading && <p>A buscar...</p>}
            {resultados.length > 0 ? (
                <ul className="resultados-lista">
                    {resultados.map((alimento, index) => (
                        <li key={alimento._id || `${alimento.description}-${index}`} onClick={() => onSelectAlimento(alimento)}>
                            <div className="alimento-nome">
                                {alimento.description}
                                {/* Tag para identificar alimentos personalizados */}
                                {!alimento.base_unit && <span className="tag-personalizado">Personalizado</span>}
                            </div>
                            <div className="alimento-macros">
                                <span><strong>Kcal:</strong> {alimento.kcal.toFixed(0)}</span>
                                <span><strong>P:</strong> {alimento.protein.toFixed(1)}g</span>
                                <span><strong>C:</strong> {alimento.carbohydrates.toFixed(1)}g</span>
                                <span><strong>G:</strong> {alimento.lipids.toFixed(1)}g</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (!loading && <p>{message}</p>)}
        </div>
    );
};

export default BuscaAlimentos;