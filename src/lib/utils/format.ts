/**
 * 数値を日本円の通貨形式にフォーマット
 * @param {number} amount - フォーマットする金額
 * @returns {string} 日本円形式の文字列（例: ¥320,000）
 * @example
 * formatCurrency(320000) // "¥320,000"
 * formatCurrency(1500.5) // "¥1,501"
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('ja-JP', {
		style: 'currency',
		currency: 'JPY',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * 数値を日本のロケール形式にフォーマット
 * @param {number} num - フォーマットする数値
 * @returns {string} カンマ区切りの数値文字列（例: 1,234,567）
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1000.5) // "1,000.5"
 */
export function formatNumber(num: number): string {
	return new Intl.NumberFormat('ja-JP').format(num);
}
