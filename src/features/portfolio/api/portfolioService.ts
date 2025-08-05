import type { Stock } from '$entities/dashboard/model';
import type { StockFormData } from '../model';

/**
 * 株式ポートフォリオ管理のAPIサービス
 */
class PortfolioService {
	private readonly baseUrl = '/api/portfolio';

	/**
	 * すべての株式を取得
	 */
	async getStocks(): Promise<Stock[]> {
		const response = await fetch(this.baseUrl);
		if (!response.ok) {
			throw new Error('Failed to fetch stocks');
		}
		return response.json();
	}

	/**
	 * 株式を追加
	 */
	async addStock(data: StockFormData): Promise<Stock> {
		const response = await fetch(this.baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			throw new Error('Failed to add stock');
		}
		return response.json();
	}

	/**
	 * 株式を更新
	 */
	async updateStock(symbol: string, data: StockFormData): Promise<Stock> {
		const response = await fetch(`${this.baseUrl}/${symbol}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			throw new Error('Failed to update stock');
		}
		return response.json();
	}

	/**
	 * 株式を削除
	 */
	async deleteStock(symbol: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/${symbol}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			throw new Error('Failed to delete stock');
		}
	}
}

export const portfolioService = new PortfolioService();
