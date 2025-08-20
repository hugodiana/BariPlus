// server/services/automationService.js
const cron = require('node-cron');
const admin = require('firebase-admin'); // ✅ 1. IMPORTAR O FIREBASE ADMIN
const Meta = require('../models/Meta');
const DailyLog = require('../models/dailyLogModel');
const User = require('../models/userModel'); // ✅ 2. IMPORTAR O MODELO USER

// Lógica para verificar uma única meta
const verificarMeta = async (meta) => {
    let metaAtingida = false;
    
    // Por enquanto, vamos focar-nos nas metas de água e proteína
    if (meta.tipo === 'agua' || meta.tipo === 'proteina') {
        const logs = await DailyLog.find({
            userId: meta.pacienteId, // Corrigido de pacienteId para userId para corresponder ao modelo
            date: { $lte: meta.prazo }
        });

        metaAtingida = logs.some(log => 
            meta.tipo === 'agua' ? log.waterConsumed >= meta.valorAlvo : log.proteinConsumed >= meta.valorAlvo
        );
    }
    
    // Atualiza o status da meta
    if (metaAtingida) {
        meta.status = 'concluida';
    } else {
        // Para todos os outros tipos, ou se não foi atingida, marca como não concluída
        meta.status = 'nao_concluida';
    }
    
    await meta.save();

    // ✅ 3. LÓGICA DE NOTIFICAÇÃO
    if (meta.status === 'concluida') {
        try {
            const paciente = await User.findById(meta.pacienteId);
            if (paciente && paciente.fcmToken) {
                const message = {
                    notification: {
                        title: '🏆 Meta Atingida!',
                        body: `Parabéns! Você concluiu a sua meta: "${meta.descricao}"`
                    },
                    token: paciente.fcmToken
                };
                
                await admin.messaging().send(message);
                console.log(`CRON JOB: Notificação de meta concluída enviada para ${paciente.email}`);
            }
        } catch (error) {
            console.error(`CRON JOB: Falha ao enviar notificação para ${meta.pacienteId}`, error);
        }
    }
};


// A tarefa principal que será executada
const verificarMetasExpiradas = async () => {
    console.log('CRON JOB: A executar verificação de metas expiradas...');
    try {
        const agora = new Date();
        const metasAtivasExpiradas = await Meta.find({
            status: 'ativa',
            prazo: { $lt: agora }
        });

        if (metasAtivasExpiradas.length === 0) {
            console.log('CRON JOB: Nenhuma meta expirada encontrada.');
            return;
        }

        console.log(`CRON JOB: Encontradas ${metasAtivasExpiradas.length} metas para verificar.`);
        
        for (const meta of metasAtivasExpiradas) {
            await verificarMeta(meta);
        }

        console.log('CRON JOB: Verificação de metas concluída.');

    } catch (error) {
        console.error('CRON JOB: Erro ao verificar metas:', error);
    }
};

// Exporta a função que inicia o agendamento
exports.iniciarVerificacaoDeMetas = () => {
    cron.schedule('5 0 * * *', verificarMetasExpiradas, {
        timezone: "America/Sao_Paulo"
    });
    
    console.log('Serviço de automação de metas agendado para ser executado diariamente às 00:05.');
};