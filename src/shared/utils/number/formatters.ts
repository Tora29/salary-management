export const formatCurrency = (amount: number | string): string => {
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
	return new Intl.NumberFormat('ja-JP', {
		style: 'currency',
		currency: 'JPY',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(numAmount);
};

export const formatNumber = (num: number | string): string => {
	const numValue = typeof num === 'string' ? parseFloat(num) : num;
	return new Intl.NumberFormat('ja-JP').format(numValue);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
	return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

export const formatCompactNumber = (num: number): string => {
	if (num >= 100000000) {
		return `${(num / 100000000).toFixed(1)}億`;
	} else if (num >= 10000) {
		return `${(num / 10000).toFixed(1)}万`;
	}
	return formatNumber(num);
};
