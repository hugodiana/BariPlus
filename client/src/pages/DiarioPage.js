import React, { useState, useEffect, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './DiarioPage.css';
import Modal from '../components/Modal';

const DiarioPage = () => {
    const [dataSelecionada, setDataSelecionada] = useState(new Date());
    const [diarioDoDia, setDiarioDoDia] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // NOVIDADE: Estados para o modal de busca
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
    const [tipoRefeicaoAtual, setTipoRefeicaoAtual] = useState(''); // Ex: 'cafeDaManha'
    const [termoBusca, setTermoBusca] = useState('');
    const [resultadosBusca, setResultadosBusca] = useState([]);
    const [loadingBusca, setLoadingBusca] = useState(false);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    // Busca o diário do dia selecionado
    useEffect(() => {
        const fetchDiario = async () => {
            setLoading(true);
            const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');
            try {
                const res = await fetch(`${apiUrl}/api/diario/${dataFormatada}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                setDiarioDoDia(data);
            } catch (error) { console.error("Erro ao buscar diário:", error); } 
            finally { setLoading(false); }
        };
        if (token) { fetchDiario(); }
    }, [dataSelecionada, token, apiUrl]);

    // NOVIDADE: Efeito para buscar na API externa quando o usuário digita
    useEffect(() => {
        if (termoBusca.length < 3) {
            setResultadosBusca([]);
            return;
        }

        const handler = setTimeout(async () => {
            setLoadingBusca(true);
            // API do Open Food Facts para o Brasil
            const urlBusca = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${termoBusca}&search_simple=1&action=process&json=1&page_size=20`;
            try {
                const response = await fetch(urlBusca);
                const data = await response.json();
                setResultadosBusca(data.products || []);
            } catch (error) {
                console.error("Erro ao buscar alimentos:", error);
            } finally {
                setLoadingBusca(false);
            }
        }, 500); // Espera 500ms após o usuário parar de digitar

        return () => clearTimeout(handler); // Limpa o timeout se o usuário continuar a digitar
    }, [termoBusca]);

    const handleOpenFoodModal = (tipoRefeicao) => {
        setTipoRefeicaoAtual(tipoRefeicao);
        setTermoBusca('');
        setResultadosBusca([]);
        setIsFoodModalOpen(true);
    };

    const handleSelectAlimento = (alimento) => {
        // Lógica para adicionar o alimento virá no próximo passo
        console.log("Alimento selecionado:", alimento);
        alert(`Você selecionou: ${alimento.product_name_pt || alimento.product_name}. Próximo passo: salvar!`);
        setIsFoodModalOpen(false);
    };

    const RefeicaoCard = ({ titulo, alimentos, tipo }) => (
        <div className="refeicao-card">
            <div className="refeicao-header">
                <h3>{titulo}</h3>
                <button className="add-alimento-btn" onClick={() => handleOpenFoodModal(tipo)}>+ Adicionar Alimento</button>
            </div>
            <div className="alimentos-list">
                {alimentos && alimentos.length > 0 ? (
                    alimentos.map(alimento => (
                        <div key={alimento._id} className="alimento-item">
                            <span>{alimento.nome} ({alimento.quantidade})</span>
                            <span>{alimento.proteinas || 0}g Prot.</span>
                        </div>
                    ))
                ) : (
                    <p className="alimento-empty">Nenhum alimento registrado.</p>
                )}
            </div>
        </div>
    );

    if (loading) return <div>Carregando diário...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Diário Alimentar</h1>
                <p>Monitore suas refeições e acompanhe seus nutrientes.</p>
            </div>
            <div className="diario-layout">
                <div className="diario-calendario">
                    <DayPicker mode="single" selected={dataSelecionada} onSelect={setDataSelecionada} locale={ptBR} showOutsideDays />
                </div>
                <div className="diario-refeicoes">
                    <h2>Refeições de {format(dataSelecionada, 'dd/MM/yyyy')}</h2>
                    <div className="refeicoes-grid">
                        <RefeicaoCard titulo="Café da Manhã" alimentos={diarioDoDia?.refeicoes.cafeDaManha} tipo="cafeDaManha" />
                        <RefeicaoCard titulo="Almoço" alimentos={diarioDoDia?.refeicoes.almoco} tipo="almoco" />
                        <RefeicaoCard titulo="Jantar" alimentos={diarioDoDia?.refeicoes.jantar} tipo="jantar" />
                        <RefeicaoCard titulo="Lanches" alimentos={diarioDoDia?.refeicoes.lanches} tipo="lanches" />
                    </div>
                </div>
            </div>

            {/* NOVIDADE: Modal para buscar e adicionar alimentos */}
            <Modal isOpen={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)}>
                <h2>Buscar Alimento</h2>
                <div className="food-search-form">
                    <input
                        type="text"
                        placeholder="Digite o nome do alimento..."
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="search-results">
                    {loadingBusca && <p>Buscando...</p>}
                    {!loadingBusca && resultadosBusca.length === 0 && termoBusca.length >= 3 && <p>Nenhum resultado encontrado.</p>}
                    <ul>
                        {resultadosBusca.map(alimento => (
                            <li key={alimento.code} onClick={() => handleSelectAlimento(alimento)}>
                                <img src={alimento.image_small_url || '/placeholder-image.png'} alt={alimento.product_name_pt || alimento.product_name} />
                                <div className="result-info">
                                    <strong>{alimento.product_name_pt || alimento.product_name}</strong>
                                    <span>{alimento.brands || 'Marca não informada'}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </Modal>
        </div>
    );
};

export default DiarioPage;