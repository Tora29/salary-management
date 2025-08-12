import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main(): Promise<void> {
	// 🌱 シードデータの投入を開始します...

	// 既存データをクリーンアップ
	await prisma.asset.deleteMany();
	await prisma.salary.deleteMany();
	await prisma.profile.deleteMany();

	// テストユーザー1: 田中太郎
	const _profile1 = await prisma.profile.create({
		data: {
			userId: '11111111-1111-1111-1111-111111111111',
			name: '田中 太郎',
			avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tanaka',
			bio: 'ソフトウェアエンジニアとして働いています。資産運用も頑張ってます！',
			salaries: {
				create: [
					{
						yearMonth: '2025-01',
						basicSalary: new Decimal(350000),
						overtime: new Decimal(25000),
						allowances: new Decimal(15000),
						deductions: new Decimal(85000),
						netSalary: new Decimal(305000),
						notes: '通常月'
					},
					{
						yearMonth: '2024-12',
						basicSalary: new Decimal(350000),
						overtime: new Decimal(45000),
						allowances: new Decimal(15000),
						deductions: new Decimal(92000),
						netSalary: new Decimal(318000),
						notes: '年末で残業多め'
					},
					{
						yearMonth: '2024-11',
						basicSalary: new Decimal(350000),
						overtime: new Decimal(30000),
						allowances: new Decimal(15000),
						deductions: new Decimal(87000),
						netSalary: new Decimal(308000)
					},
					{
						yearMonth: '2024-10',
						basicSalary: new Decimal(350000),
						overtime: new Decimal(20000),
						allowances: new Decimal(15000),
						deductions: new Decimal(84000),
						netSalary: new Decimal(301000)
					},
					{
						yearMonth: '2024-09',
						basicSalary: new Decimal(350000),
						overtime: new Decimal(35000),
						allowances: new Decimal(15000),
						deductions: new Decimal(89000),
						netSalary: new Decimal(311000),
						notes: '繁忙期'
					},
					{
						yearMonth: '2024-08',
						basicSalary: new Decimal(350000),
						overtime: new Decimal(15000),
						allowances: new Decimal(15000),
						deductions: new Decimal(83000),
						netSalary: new Decimal(297000)
					}
				]
			},
			assets: {
				create: [
					{
						assetType: 'stock',
						symbol: '7203',
						name: 'トヨタ自動車',
						quantity: new Decimal(100),
						purchasePrice: new Decimal(2850),
						currentPrice: new Decimal(3125),
						currency: 'JPY',
						purchaseDate: new Date('2024-03-15'),
						notes: '長期投資目的'
					},
					{
						assetType: 'stock',
						symbol: '9984',
						name: 'ソフトバンクグループ',
						quantity: new Decimal(50),
						purchasePrice: new Decimal(7500),
						currentPrice: new Decimal(8250),
						currency: 'JPY',
						purchaseDate: new Date('2024-06-20'),
						notes: 'AI関連'
					},
					{
						assetType: 'stock',
						symbol: 'AAPL',
						name: 'Apple Inc.',
						quantity: new Decimal(10),
						purchasePrice: new Decimal(185.5),
						currentPrice: new Decimal(220.75),
						currency: 'USD',
						purchaseDate: new Date('2024-01-10'),
						notes: '米国株投資'
					},
					{
						assetType: 'crypto',
						symbol: 'BTC',
						name: 'Bitcoin',
						quantity: new Decimal(0.05),
						purchasePrice: new Decimal(6500000),
						currentPrice: new Decimal(7200000),
						currency: 'JPY',
						purchaseDate: new Date('2024-02-01'),
						notes: '暗号資産投資'
					},
					{
						assetType: 'cash',
						name: '普通預金',
						quantity: new Decimal(2500000),
						purchasePrice: new Decimal(1),
						currentPrice: new Decimal(1),
						currency: 'JPY',
						purchaseDate: new Date('2024-01-01'),
						notes: '緊急資金'
					}
				]
			}
		}
	});

	// テストユーザー2: 佐藤花子
	const _profile2 = await prisma.profile.create({
		data: {
			userId: '22222222-2222-2222-2222-222222222222',
			name: '佐藤 花子',
			avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sato',
			bio: '営業職です。コツコツと資産形成中。',
			salaries: {
				create: [
					{
						yearMonth: '2025-01',
						basicSalary: new Decimal(280000),
						overtime: new Decimal(10000),
						allowances: new Decimal(20000),
						deductions: new Decimal(62000),
						netSalary: new Decimal(248000),
						notes: '営業手当含む'
					},
					{
						yearMonth: '2024-12',
						basicSalary: new Decimal(280000),
						overtime: new Decimal(15000),
						allowances: new Decimal(45000),
						deductions: new Decimal(75000),
						netSalary: new Decimal(265000),
						notes: 'ボーナス月'
					},
					{
						yearMonth: '2024-11',
						basicSalary: new Decimal(280000),
						overtime: new Decimal(8000),
						allowances: new Decimal(20000),
						deductions: new Decimal(61000),
						netSalary: new Decimal(247000)
					},
					{
						yearMonth: '2024-10',
						basicSalary: new Decimal(280000),
						overtime: new Decimal(12000),
						allowances: new Decimal(20000),
						deductions: new Decimal(63000),
						netSalary: new Decimal(249000)
					},
					{
						yearMonth: '2024-09',
						basicSalary: new Decimal(280000),
						overtime: new Decimal(5000),
						allowances: new Decimal(20000),
						deductions: new Decimal(60000),
						netSalary: new Decimal(245000)
					},
					{
						yearMonth: '2024-08',
						basicSalary: new Decimal(280000),
						overtime: new Decimal(10000),
						allowances: new Decimal(20000),
						deductions: new Decimal(62000),
						netSalary: new Decimal(248000)
					}
				]
			},
			assets: {
				create: [
					{
						assetType: 'stock',
						symbol: '8306',
						name: '三菱UFJフィナンシャル・グループ',
						quantity: new Decimal(200),
						purchasePrice: new Decimal(1250),
						currentPrice: new Decimal(1480),
						currency: 'JPY',
						purchaseDate: new Date('2024-04-10'),
						notes: '配当重視'
					},
					{
						assetType: 'stock',
						symbol: '9433',
						name: 'KDDI',
						quantity: new Decimal(80),
						purchasePrice: new Decimal(4200),
						currentPrice: new Decimal(4550),
						currency: 'JPY',
						purchaseDate: new Date('2024-05-15'),
						notes: '通信株'
					},
					{
						assetType: 'bond',
						name: '個人向け国債10年',
						quantity: new Decimal(1000000),
						purchasePrice: new Decimal(1),
						currentPrice: new Decimal(1.002),
						currency: 'JPY',
						purchaseDate: new Date('2023-12-01'),
						notes: '安定運用'
					},
					{
						assetType: 'cash',
						name: '定期預金',
						quantity: new Decimal(1500000),
						purchasePrice: new Decimal(1),
						currentPrice: new Decimal(1),
						currency: 'JPY',
						purchaseDate: new Date('2024-01-01'),
						notes: '6ヶ月定期'
					},
					{
						assetType: 'other',
						name: 'iDeCo',
						quantity: new Decimal(800000),
						purchasePrice: new Decimal(1),
						currentPrice: new Decimal(1.05),
						currency: 'JPY',
						purchaseDate: new Date('2022-01-01'),
						notes: '老後資金'
					}
				]
			}
		}
	});

	// ✅ シードデータの投入が完了しました！
	// 📊 作成されたデータ:
	//   - プロファイル: 2件
	//   - 給料データ: 12件（各ユーザー6ヶ月分）
	//   - 資産データ: 10件（各ユーザー5種類）
	// ⚠️  注意: Supabaseの認証ユーザーは別途作成が必要です！
	//   以下のユーザーをSupabaseダッシュボードから作成してください:
	//   - Email: test1@example.com (田中太郎)
	//   - Email: test2@example.com (佐藤花子)
}

main()
	.catch((e) => {
		// エラーハンドリングではconsole.errorは許可されている
		console.error('❌ シードデータの投入中にエラーが発生しました:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
