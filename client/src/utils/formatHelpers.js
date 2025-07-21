// client/src/utils/formatHelpers.js
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (amountInCents) => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

// ✅ NOVIDADE: A função que estava em falta
export const formatDate = (dateInput) => {
  // Se a data for inválida ou não existir, retorna um hífen
  if (!dateInput) return '-';
  
  try {
    const date = new Date(dateInput);
    // Verifica se a data é válida antes de formatar
    if (isNaN(date.getTime())) {
      return '-';
    }
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    return '-'; // Retorna um hífen em caso de qualquer erro
  }
};