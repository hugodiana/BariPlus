import React, { useState, useEffect } from 'react';
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
    
    // Estados para o modal de busca
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
    const [tipoRefeicaoAtual, setTipoRefeicaoAtual] = useState('');
    const [termoBusca, setTermoBusca] = useState('');
    const [resultadosBusca, setResultadosBusca] = useState([]);
    const [loadingBusca, setLoadingBusca] = useState(false);

    // Estados para o modal de quantidade
    const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
    const [alimentoSelecionado, setAlimentoSelecionado] = useState(null);
    const [quantidadeConsumida, setQuantidadeConsumida] = useState('100g');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

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

    useEffect(() => {
        if (token) {
            fetchDiario();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataSelecionada, token, apiUrl]);

    useEffect(() => {
        if (termoBusca.length < 3) {
            setResultadosBusca([]);
            return;
        }
        const handler = setTimeout(async () => {
            setLoadingBusca(true);
            const urlBusca = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${termoBusca}&search_simple=1&action=process&json=1&page_size=20`;
            try {
                const response = await fetch(urlBusca);
                const data = await response.json();
                setResultadosBusca(data.products || []);
            } catch (error) { console.error("Erro ao buscar alimentos:", error); } 
            finally { setLoadingBusca(false); }
        }, 500);
        return () => clearTimeout(handler);
    }, [termoBusca]);

    const handleOpenFoodModal = (tipoRefeicao) => {
        setTipoRefeicaoAtual(tipoRefeicao);
        setTermoBusca('');
        setResultadosBusca([]);
        setIsFoodModalOpen(true);
    };

    const handleSelectAlimento = (alimento) => {
        setAlimentoSelecionado(alimento);
        setIsFoodModalOpen(false);
        setIsQuantityModalOpen(true);
    };

    const handleSaveAlimento = async (e) => {
        e.preventDefault();
        if (!alimentoSelecionado) return;

        const novoAlimento = {
            nome: alimentoSelecionado.product_name_pt || alimentoSelecionado.product_name,
            quantidade: quantidadeConsumida,
            calorias: alimentoSelecionado.nutriments?.['energy-kcal_100g'] || 0,
            proteinas: alimentoSelecionado.nutriments?.proteins_100g || 0,
        };

        const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');

        try {
            await fetch(`${apiUrl}/api/diario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    date: dataFormatada,
                    tipoRefeicao: tipoRefeicaoAtual,
                    alimento: novoAlimento,
                }),
            });
            setIsQuantityModalOpen(false);
            setAlimentoSelecionado(null);
            setQuantidadeConsumida('100g');
            fetchDiario();
        } catch (error) {
            console.error("Erro ao salvar alimento:", error);
        }
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

            <Modal isOpen={isQuantityModalOpen} onClose={() => setIsQuantityModalOpen(false)}>
                <h2>Adicionar Alimento</h2>
                {alimentoSelecionado && (
                    <>
                        <p>Qual a quantidade de <strong>{alimentoSelecionado.product_name_pt || alimentoSelecionado.product_name}</strong> você consumiu?</p>
                        <form onSubmit={handleSaveAlimento} className="modal-form">
                            <label>Quantidade</label>
                            <input
                                type="text"
                                value={quantidadeConsumida}
                                onChange={(e) => setQuantidadeConsumida(e.target.value)}
                                placeholder="Ex: 100g, 1 unidade, 2 fatias..."
                                required
                            />
                            <button type="submit" className="submit-button">Salvar Alimento</button>
                        </form>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default DiarioPage;