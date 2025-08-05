import { prisma } from '../src/lib/utils/server/prisma';

async function backupAndDropSalaryTable() {
	try {
		// Salaryテーブルのデータを確認
		const salaryData = await prisma.salary.findMany({
			orderBy: { paymentDate: 'desc' }
		});

		console.log(`Salaryテーブルに ${salaryData.length} 件のデータがあります。`);

		if (salaryData.length > 0) {
			console.log('\n=== バックアップデータ ===');
			salaryData.forEach((record) => {
				console.log({
					id: record.id,
					paymentDate: record.paymentDate,
					grossAmount: record.grossAmount.toString(),
					deduction: record.deduction.toString(),
					netAmount: record.netAmount.toString(),
					createdAt: record.createdAt,
					updatedAt: record.updatedAt
				});
			});
		}

		// データを削除
		console.log('\nSalaryテーブルのデータを削除します...');
		await prisma.salary.deleteMany();
		console.log('削除完了！');
	} catch (error) {
		console.error('エラーが発生しました:', error);
	} finally {
		await prisma.$disconnect();
	}
}

backupAndDropSalaryTable();
