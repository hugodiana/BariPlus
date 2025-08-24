// client/src/pages/DashboardPage.js
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fetchApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/ui/Card';
import WeightProgressCard from '../components/dashboard/WeightProgressCard';
import DailyGoalsCard from '../components/dashboard/DailyGoalsCard';
import DailyMedicationCard from '../components/dashboard/DailyMedicationCard';
import MetasCard from '../components/dashboard/MetasCard';
import ConteudoRecenteCard from '../components/dashboard/ConteudoRecenteCard';
import './DashboardPage.css';

// Funções de busca de dados (separadas da lógica do componente)
const fetchData = async (endpoint) => await fetchApi(endpoint);

const DashboardPage = () => {
    const { user, updateUser } = useAuth();
    const queryClient = useQueryClient();
    const todayString = format(new Date(), 'yyyy-MM-dd');

    // Buscando todos os dados necessários com useQuery
    const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
        queryKey: ['dashboardData'],
        queryFn: () => Promise.all([
            fetchData('/api/pesos'),
            fetchData('/api/dailylog/today'),
            fetchData('/api/medication/list'),
            fetchData(`/api/medication/log/${todayString}`),
            fetchData('/api/metas'),
            fetchData('/api/conteudos')
        ]).then(([pesos, dailyLog, medicationList, medicationLog, metas, conteudos]) => ({
            pesos,
            dailyLog,
            medicationList,
            medicationLog,
            metas,
            conteudos
        })),
        staleTime: 5 * 60 * 1000, // Cache de 5 minutos
    });

    // Mutação para atualizar o log diário (água/proteína)
    const trackConsumptionMutation = useMutation({
        mutationFn: (consumptionData) => fetchApi('/api/dailylog/track', { method: 'POST', body: JSON.stringify(consumptionData) }),
        onSuccess: (data) => {
            // Atualiza os dados em cache sem precisar de um refetch
            queryClient.setQueryData(['dashboardData'], (oldData) => ({
                ...oldData,
                dailyLog: data.updatedLog,
            }));
            if (data.novasConquistas?.length > 0) {
                data.novasConquistas.forEach(c => toast.info(<div><strong>🏆 Nova Conquista!</strong><br />{c.nome}</div>));
            }
        },
        onError: (error) => toast.error(error.message),
    });
    
    // Mutação para marcar/desmarcar a toma de medicação
    const toggleDoseMutation = useMutation({
        mutationFn: (doseData) => fetchApi('/api/medication/log/toggle', { method: 'POST', body: JSON.stringify(doseData) }),
        onSuccess: (updatedLog) => {
            queryClient.setQueryData(['dashboardData'], (oldData) => ({
                ...oldData,
                medicationLog: updatedLog,
            }));
        },
        onError: (error) => toast.error(error.message),
    });

    const handleToggleToma = (med, horario) => {
        const doseInfo = { medicationId: med._id, nome: med.nome, horario: horario, dosagem: med.dosagem || `${med.quantidade} ${med.unidade}` };
        toggleDoseMutation.mutate({ date: todayString, doseInfo });
    };

    if (isLoadingDashboard) {
        return <LoadingSpinner />;
    }

    // Se os dados ainda não carregaram por algum motivo, exibe o spinner
    if (!dashboardData) {
        return <LoadingSpinner />;
    }

    return (
        <div className="page-container dashboard-page">
            <div className="page-header">
                <h1>Olá, {user?.nome}!</h1>
                <p>Aqui está um resumo da sua jornada hoje.</p>
            </div>
            
            <div className="dashboard-grid">
                <div className="main-col">
                    <WeightProgressCard usuario={user} historicoPesos={dashboardData.pesos} />
                    <DailyGoalsCard 
                        log={dashboardData.dailyLog} 
                        usuario={user}
                        onTrack={trackConsumptionMutation.mutate}
                        onUserUpdate={updateUser}
                    />
                </div>
                <div className="side-col">
                    <DailyMedicationCard 
                        medicamentos={dashboardData.medicationList?.medicamentos || []}
                        logDoDia={dashboardData.medicationLog}
                        onToggleToma={handleToggleToma}
                        isReadOnly={false} // No dashboard, o usuário pode interagir
                    />
                    <MetasCard metas={dashboardData.metas || []} />
                    <ConteudoRecenteCard conteudos={dashboardData.conteudos || []} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;