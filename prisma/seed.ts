import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
	// 既存データを削除（開発環境のみ）
	await prisma.asset.deleteMany();
	await prisma.stock.deleteMany();
	await prisma.salary.deleteMany();

	// 給料データの作成（過去6ヶ月分）
	const salaryData = [
		{
			paymentDate: new Date('2025-07-25'),
			grossAmount: 350000,
			deduction: 75000,
			netAmount: 275000
		},
		{
			paymentDate: new Date('2025-06-25'),
			grossAmount: 350000,
			deduction: 75000,
			netAmount: 275000
		},
		{
			paymentDate: new Date('2025-05-25'),
			grossAmount: 350000,
			deduction: 75000,
			netAmount: 275000
		},
		{
			paymentDate: new Date('2025-04-25'),
			grossAmount: 380000,
			deduction: 82000,
			netAmount: 298000
		}, // ボーナス月
		{
			paymentDate: new Date('2025-03-25'),
			grossAmount: 350000,
			deduction: 75000,
			netAmount: 275000
		},
		{
			paymentDate: new Date('2025-02-25'),
			grossAmount: 350000,
			deduction: 75000,
			netAmount: 275000
		}
	];

	for (const salary of salaryData) {
		await prisma.salary.create({
			data: {
				paymentDate: salary.paymentDate,
				grossAmount: new Decimal(salary.grossAmount),
				deduction: new Decimal(salary.deduction),
				netAmount: new Decimal(salary.netAmount)
			}
		});
	}

	// 株式データの作成
	const stockData = [
		{
			symbol: '7203',
			name: 'トヨタ自動車',
			quantity: 100,
			purchasePrice: 2800,
			purchaseDate: new Date('2024-01-15'),
			currentPrice: 3150
		},
		{
			symbol: '9984',
			name: 'ソフトバンクグループ',
			quantity: 50,
			purchasePrice: 8500,
			purchaseDate: new Date('2024-03-20'),
			currentPrice: 9200
		},
		{
			symbol: '6758',
			name: 'ソニーグループ',
			quantity: 30,
			purchasePrice: 14500,
			purchaseDate: new Date('2024-06-10'),
			currentPrice: 15200
		},
		{
			symbol: '6861',
			name: 'キーエンス',
			quantity: 10,
			purchasePrice: 62000,
			purchaseDate: new Date('2024-09-05'),
			currentPrice: 65500
		}
	];

	for (const stock of stockData) {
		await prisma.stock.create({
			data: {
				symbol: stock.symbol,
				name: stock.name,
				quantity: stock.quantity,
				purchasePrice: new Decimal(stock.purchasePrice),
				purchaseDate: stock.purchaseDate,
				currentPrice: new Decimal(stock.currentPrice),
				lastUpdated: new Date()
			}
		});
	}

	// 資産データの作成
	const assetData = [
		{
			type: 'deposit',
			name: '普通預金（三菱UFJ銀行）',
			amount: 3500000
		},
		{
			type: 'deposit',
			name: '定期預金（三菱UFJ銀行）',
			amount: 2000000
		},
		{
			type: 'cash',
			name: '現金',
			amount: 50000
		}
	];

	for (const asset of assetData) {
		await prisma.asset.create({
			data: {
				type: asset.type,
				name: asset.name,
				amount: new Decimal(asset.amount)
			}
		});
	}

	console.log('✅ シードデータの作成が完了しました！');

	// 作成されたデータの確認
	const salaryCount = await prisma.salary.count();
	const stockCount = await prisma.stock.count();
	const assetCount = await prisma.asset.count();

	console.log(`📊 作成されたデータ:`);
	console.log(`  - 給料データ: ${salaryCount}件`);
	console.log(`  - 株式データ: ${stockCount}件`);
	console.log(`  - 資産データ: ${assetCount}件`);
}

main()
	.catch((e) => {
		console.error('❌ シードデータの作成中にエラーが発生しました:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
