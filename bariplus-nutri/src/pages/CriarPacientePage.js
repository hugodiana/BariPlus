// src/pages/CriarPacientePage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import Card from '../components/ui/Card';
import './PlanoAlimentarPage.css'; // Reutilizaremos alguns estilos

const CriarPacientePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nomeCompleto: '',
        email: '',
        telefone: '',
        dataNascimento: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetchApi('/api/nutri/pacientes-locais', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            toast.success('Paciente adicionado com sucesso!');
            navigate('/pacientes');
        } catch (error) {
            toast.error(error.message || 'Erro ao adicionar paciente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <Link to="/pacientes" className="back-link">‹ Voltar para a lista de pacientes</Link>
            <div className="page-header">
                <h1>Adicionar Novo Paciente</h1>
                <p>Registe um novo paciente no seu prontuário particular.</p>
            </div>
            <form onSubmit={handleSubmit}>
                <Card>
                    <div className="form-group">
                        <label>Nome Completo</label>
                        <input type="text" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Telefone</label>
                        <input type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Data de Nascimento</label>
                        <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleInputChange} />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'A guardar...' : 'Guardar Paciente'}
                        </button>
                    </div>
                </Card>
            </form>
        </div>
    );
};

export default CriarPacientePage;