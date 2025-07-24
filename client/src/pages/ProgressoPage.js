import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from '../components/Modal';
import api from '../services/api';
import './ProgressoPage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProgressoPage = () => {
  const [progressData, setProgressData] = useState({
    history: [],
    loading: true,
    newEntry: {
      weight: '',
      waist: '',
      hip: '',
      arm: '',
      photo: null
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProgressHistory = useCallback(async () => {
    try {
      setProgressData(prev => ({ ...prev, loading: true }));
      const response = await api.get('/progress');
      const sortedData = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setProgressData(prev => ({ ...prev, history: sortedData }));
    } catch (error) {
      console.error("Error fetching progress history:", error);
      toast.error('Erro ao carregar histórico de progresso');
    } finally {
      setProgressData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchProgressHistory();
  }, [fetchProgressHistory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProgressData(prev => ({
      ...prev,
      newEntry: {
        ...prev.newEntry,
        [name]: value
      }
    }));
  };

  const handleFileChange = (e) => {
    setProgressData(prev => ({
      ...prev,
      newEntry: {
        ...prev.newEntry,
        photo: e.target.files[0]
      }
    }));
  };

  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('weight', progressData.newEntry.weight);
    formData.append('waist', progressData.newEntry.waist);
    formData.append('hip', progressData.newEntry.hip);
    formData.append('arm', progressData.newEntry.arm);
    
    if (progressData.newEntry.photo) {
      formData.append('photo', progressData.newEntry.photo);
    }

    try {
      await api.post('/progress', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Progresso registrado com sucesso!');
      setIsModalOpen(false);
      setProgressData(prev => ({
        ...prev,
        newEntry: {
          weight: '',
          waist: '',
          hip: '',
          arm: '',
          photo: null
        }
      }));
      fetchProgressHistory();
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar progresso');
    }
  };

  const chartData = {
    labels: progressData.history.map(item => 
      format(new Date(item.date), 'dd/MM/yyyy')
    ),
    datasets: [{
      label: 'Peso (kg)',
      data: progressData.history.map(item => item.weight),
      borderColor: 'var(--action-blue)',
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      fill: true
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Evolução de Peso',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw} kg`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Peso (kg)'
        }
      }
    }
  };

  if (progressData.loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <p>Carregando seu progresso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Meu Progresso</h1>
        <p>Acompanhe sua evolução de peso e medidas corporais</p>
      </div>

      <button 
        className="primary-button"
        onClick={() => setIsModalOpen(true)}
      >
        + Adicionar Novo Registro
      </button>

      {progressData.history.length > 0 ? (
        <>
          <div className="progress-card chart-container">
            <Line options={chartOptions} data={chartData} />
          </div>

          {progressData.history.some(item => item.photoUrl) && (
            <div className="progress-card">
              <h3>Galeria de Fotos</h3>
              <div className="photo-gallery">
                {progressData.history
                  .filter(item => item.photoUrl)
                  .map(item => (
                    <div key={item._id} className="photo-item">
                      <a href={item.photoUrl} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={item.photoUrl} 
                          alt={`Progresso em ${format(new Date(item.date), 'dd/MM/yyyy')}`} 
                        />
                      </a>
                      <time>
                        {format(new Date(item.date), 'dd MMM yyyy', { locale: ptBR })}
                      </time>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="progress-card">
            <h3>Histórico Completo</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Peso (kg)</th>
                    <th>Cintura (cm)</th>
                    <th>Quadril (cm)</th>
                    <th>Braço (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...progressData.history].reverse().map(item => (
                    <tr key={item._id}>
                      <td>{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                      <td>{item.weight?.toFixed(1) || '-'}</td>
                      <td>{item.measurements?.waist || '-'}</td>
                      <td>{item.measurements?.hip || '-'}</td>
                      <td>{item.measurements?.arm || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>Nenhum registro encontrado. Adicione seu primeiro registro para começar!</p>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      >
        <h2>Novo Registro de Progresso</h2>
        <form onSubmit={handleSubmitProgress} className="progress-form">
          <div className="form-group">
            <label htmlFor="weight">Peso (kg) *</label>
            <input
              id="weight"
              type="number"
              name="weight"
              step="0.1"
              value={progressData.newEntry.weight}
              onChange={handleInputChange}
              required
              min="30"
              max="300"
            />
          </div>

          <div className="form-group">
            <label htmlFor="waist">Cintura (cm)</label>
            <input
              id="waist"
              type="number"
              name="waist"
              step="0.1"
              value={progressData.newEntry.waist}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="hip">Quadril (cm)</label>
            <input
              id="hip"
              type="number"
              name="hip"
              step="0.1"
              value={progressData.newEntry.hip}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="arm">Braço (cm)</label>
            <input
              id="arm"
              type="number"
              name="arm"
              step="0.1"
              value={progressData.newEntry.arm}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="photo">Foto de Progresso (opcional)</label>
            <input
              id="photo"
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <button type="submit" className="submit-button">
            Salvar Registro
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProgressoPage;