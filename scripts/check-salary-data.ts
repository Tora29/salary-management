import { prismaDataToSalarySlip } from '../src/entities/salary-slip/api/converters';
import { prisma } from '../src/lib/utils/server/prisma';

async function checkSalarySlipData() {
	try {
		// 全ての給料明細を取得
		const slips = await prisma.salarySlip.findMany({
			orderBy: { paymentDate: 'desc' }
		});

		console.log(`給料明細データ: ${slips.length}件\n`);

		// 各レコードを表示
		for (const slip of slips) {
			const converted = prismaDataToSalarySlip(slip);

			console.log(
				`=== ${converted.salarySlip.employeeName || '従業員名なし'} (${converted.salarySlip.paymentDate}) ===`
			);
			console.log('勤怠情報:');
			console.log(`- 固定外残業時間: ${converted.salarySlip.attendance.overtimeHours}時間`);
			console.log(
				`- 固定外残業時間(60時間超): ${converted.salarySlip.attendance.overtimeHoursOver60}時間`
			);
			console.log(`- 深夜割増時間: ${converted.salarySlip.attendance.lateNightHours}時間`);
			console.log(`- 有休残日数: ${converted.salarySlip.attendance.paidLeaveDays}日`);
			console.log(`差引支給額: ¥${converted.salarySlip.netPay.toLocaleString()}`);
			console.log('');
		}
	} catch (error) {
		console.error('エラーが発生しました:', error);
	} finally {
		await prisma.$disconnect();
	}
}

checkSalarySlipData();
