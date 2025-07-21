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
export const formatDate = (dateString) => {
  if (!dateString) return '';
  // Converte a string de data para um objeto Date e formata
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
};