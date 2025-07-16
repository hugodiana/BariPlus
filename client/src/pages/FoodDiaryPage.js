import React, { useState } from 'react';
import './FoodDiaryPage.css';

const FoodDiaryPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Pesquise por um alimento para ver os detalhes nutricionais.');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;

        setLoading(true);
        setSearchResults([]);
        setMessage('');

        try {
            const response = await fetch(`${apiUrl}/api/foods/search?query=${encodeURIComponent(searchTerm)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar alimentos.');
            }

            const data = await response.json();

            if (data.length === 0) {
                setMessage(`Nenhum resultado encontrado para "${searchTerm}".`);
            } else {
                setSearchResults(data);
            }
        } catch (error) {
            console.error("Erro na pesquisa:", error);
            setMessage("Ocorreu um erro ao conectar com o serviço. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Diário Alimentar</h1>
                <p>Pesquise e registre suas refeições diárias.</p>
            </div>

            <div className="search-container">
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ex: Frango grelhado"
                        className="search-input"
                    />
                    <button type="submit" className="search-button" disabled={loading}>
                        {loading ? 'Buscando...' : 'Pesquisar'}
                    </button>
                </form>
            </div>

            <div className="results-container">
                {loading && <p>Carregando...</p>}
                {message && !loading && <p className="info-message">{message}</p>}
                
                {searchResults.length > 0 && (
                    <ul className="results-list">
                        {searchResults.map(food => (
                            <li key={food.food_id} className="result-item">
                                <div className="food-name">{food.food_name}</div>
                                <div className="food-description">{food.food_description}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default FoodDiaryPage;