import { prisma } from '$lib/utils/server/prisma';

import type { StockFormData } from '../model';
import { getStockInfo } from './stockInfoService';

import type { Stock } from '$entities/dashboard/model';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * 株式ポートフォリオのデータアクセス層
 */
export class PortfolioRepository {
	/**
	 * すべての株式を取得
	 */
	async findAll(): Promise<Stock[]> {
		const stocks = await prisma.stock.findMany({
			orderBy: {
				createdAt: 'desc'
			}
		});

		return stocks.map(this.mapToStockEntity);
	}

	/**
	 * 銘柄コードで株式を検索
	 */
	async findBySymbol(symbol: string): Promise<Stock | null> {
		const stock = await prisma.stock.findFirst({
			where: { symbol }
		});

		return stock ? this.mapToStockEntity(stock) : null;
	}

	/**
	 * 株式を作成
	 */
	async create(data: StockFormData): Promise<Stock> {
		// 証券コードから銘柄名を取得
		const stockInfo = await getStockInfo(data.symbol);
		if (!stockInfo) {
			throw new Error('無効な証券コードです');
		}

		const stock = await prisma.stock.create({
			data: {
				symbol: data.symbol,
				name: stockInfo.name,
				quantity: data.quantity,
				purchasePrice: new Decimal(data.purchasePrice),
				purchaseDate: new Date(),
				currentPrice: new Decimal(data.purchasePrice) // 初期値は購入価格と同じ
			}
		});

		return this.mapToStockEntity(stock);
	}

	/**
	 * 株式を更新
	 */
	async update(symbol: string, data: StockFormData): Promise<Stock> {
		await prisma.stock.updateMany({
			where: { symbol },
			data: {
				quantity: data.quantity,
				purchasePrice: new Decimal(data.purchasePrice),
				updatedAt: new Date()
			}
		});

		// 更新後のデータを取得
		const updatedStock = await this.findBySymbol(symbol);
		if (!updatedStock) {
			throw new Error('株式の更新に失敗しました');
		}

		return updatedStock;
	}

	/**
	 * 株式を削除
	 */
	async delete(symbol: string): Promise<void> {
		await prisma.stock.deleteMany({
			where: { symbol }
		});
	}

	/**
	 * 現在価格を更新
	 */
	async updateCurrentPrice(symbol: string, currentPrice: number): Promise<void> {
		await prisma.stock.updateMany({
			where: { symbol },
			data: {
				currentPrice: new Decimal(currentPrice),
				lastUpdated: new Date()
			}
		});
	}

	/**
	 * PrismaのStockをStockエンティティにマッピング
	 */
	private mapToStockEntity(stock: {
		symbol: string;
		name: string;
		quantity: number;
		purchasePrice: Decimal;
		currentPrice: Decimal | null;
	}): Stock {
		const currentPrice = stock.currentPrice
			? Number(stock.currentPrice)
			: Number(stock.purchasePrice);
		const value = stock.quantity * currentPrice;

		return {
			symbol: stock.symbol,
			name: stock.name,
			quantity: stock.quantity,
			purchasePrice: Number(stock.purchasePrice),
			currentPrice,
			value
		};
	}
}

export const portfolioRepository = new PortfolioRepository();
