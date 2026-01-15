/**
 * Currency formatting utility for Indian Rupee (₹)
 * Uses Intl.NumberFormat for proper Indian number formatting
 */

/**
 * Format a number as Indian Rupee currency
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "₹ 1,25,000")
 */
export const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return '₹ 0';
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numAmount);
};

/**
 * Format a number as compact Indian Rupee (e.g., "₹ 1.2L", "₹ 2.5Cr")
 * @param {number|string} amount - The amount to format
 * @returns {string} Compact formatted currency string
 */
export const formatCurrencyCompact = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return '₹ 0';
    }

    // For amounts >= 1 crore (10 million)
    if (numAmount >= 10000000) {
        return `₹ ${(numAmount / 10000000).toFixed(1)}Cr`;
    }

    // For amounts >= 1 lakh (100 thousand)
    if (numAmount >= 100000) {
        return `₹ ${(numAmount / 100000).toFixed(1)}L`;
    }

    // For smaller amounts, use regular formatting
    return formatCurrency(numAmount);
};

/**
 * Parse currency string back to number
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed number
 */
export const parseCurrency = (currencyString) => {
    if (typeof currencyString === 'number') {
        return currencyString;
    }

    // Remove currency symbol, commas, and spaces
    const cleaned = currencyString.replace(/[₹,\s]/g, '');
    return parseFloat(cleaned) || 0;
};
