/**
 * Helpers compartilhados entre componentes
 */

export const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'aberta':
      return 'Aberta';
    case 'cheia':
      return 'Cheia';
    case 'cancelada':
      return 'Cancelada';
    case 'realizada':
      return 'Realizada';
    default:
      return status;
  }
};
