// client/src/utils/formatHelpers.js

export const formatCurrency = (amountInCents) => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

// Você pode adicionar outras funções de formatação aqui no futuro