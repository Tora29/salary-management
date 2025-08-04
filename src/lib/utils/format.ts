export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('ja-JP', {
		style: 'currency',
		currency: 'JPY',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

export function formatNumber(num: number): string {
	return new Intl.NumberFormat('ja-JP').format(num);
}
