/**
 * Format a number as Russian currency (Rubles)
 * @param value Number to format
 * @returns Formatted currency string
 */
export const formatRuCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(value);
};

/**
 * Format currency (generic function)
 * @param value Number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return formatRuCurrency(value);
};

/**
 * Format a date as a Russian date string
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatRuDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ru-RU').format(date);
}; 