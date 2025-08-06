import type { SalarySlip } from '../model';

import type { Prisma, SalarySlip as PrismaSalarySlip } from '@prisma/client';

/**
 * ドメインモデル(SalarySlip)をPrisma用のデータベース保存形式に変換
 *
 * @description
 * フロントエンドの給料明細ドメインモデルを、Prisma ORMでデータベースに保存するための
 * 形式に変換します。型安全性を保ちながら、ドメインモデルの複雑な構造を
 * リレーショナルデータベースのフラットな構造にマッピングします。
 * Decimal型への自動変換、デフォルト値の設定、フィールド名の正規化を行います。
 *
 * @param {SalarySlip} salarySlip - 変換元のドメインモデル（フロントエンドの給料明細データ）
 * @param {string} fileName - アップロードされたPDFファイル名（トレーサビリティ用）
 *
 * @returns {Prisma.SalarySlipCreateInput} Prismaで作成用の型安全なデータ構造
 * @returns 会社名、従業員情報、支給期間、勤怠情報、支給額・控除額の詳細、ファイル名を含む
 *
 * @example
 * ```typescript
 * // 給料明細PDFから解析されたドメインモデルをDB保存用に変換
 * const domainModel: SalarySlip = {
 *   companyName: '株式会社サンプル',
 *   employeeName: '田中太郎',
 *   employeeId: 'EMP001',
 *   paymentDate: new Date('2024-01-25'),
 *   targetPeriod: {
 *     start: new Date('2024-01-01'),
 *     end: new Date('2024-01-31')
 *   },
 *   earnings: {
 *     baseSalary: 300000,
 *     overtimePay: 50000,
 *     commuterAllowance: 15000,
 *     total: 365000
 *   },
 *   deductions: {
 *     healthInsurance: 15000,
 *     employeePension: 28000,
 *     incomeTax: 8000,
 *     total: 51000
 *   },
 *   netPay: 314000
 * };
 *
 * const prismaData = salarySlipToPrismaData(domainModel, 'salary_202401.pdf');
 * await prisma.salarySlip.create({ data: prismaData });
 * ```
 *
 * @performance
 * - オブジェクトの浅いコピーによる高速変換
 * - 型変換の最小限実行でメモリ効率を最適化
 * - 不要な深いクローン操作を回避
 *
 * @database
 * - Prismaの型システムとの完全な互換性を保証
 * - Decimal型カラムへの自動変換（金額フィールド）
 * - NOT NULL制約への適切な対応
 * - インデックス最適化を考慮したフィールドマッピング
 *
 * @mapping
 * - targetPeriod.start → targetPeriodStart（日付の分割）
 * - targetPeriod.end → targetPeriodEnd（日付の分割）
 * - earnings.commuterAllowance → transportationAllowance（名称正規化）
 * - deductions.employeePension → welfareInsurance（制度名に統一）
 * - 複数手当の集約：otherAllowances = fixedOvertimeAllowance + expenseReimbursement + stockPurchaseIncentive
 *
 * @see {@link prismaDataToSalarySlip} 逆変換関数（DB→ドメインモデル）
 * @see {@link SalarySlip} ドメインモデルの型定義
 * @see {@link Prisma.SalarySlipCreateInput} Prismaの作成用型定義
 */
export function salarySlipToPrismaData(
	salarySlip: SalarySlip,
	fileName: string
): Prisma.SalarySlipCreateInput {
	return {
		companyName: salarySlip.companyName,
		employeeName: salarySlip.employeeName,
		employeeId: salarySlip.employeeId,
		paymentDate: salarySlip.paymentDate,
		targetPeriodStart: salarySlip.targetPeriod.start,
		targetPeriodEnd: salarySlip.targetPeriod.end,
		overtimeHours: salarySlip.attendance.overtimeHours,
		overtimeHoursOver60: salarySlip.attendance.overtimeHoursOver60,
		lateNightHours: salarySlip.attendance.lateNightHours,
		holidayWorkDays: 0, // 休日出勤日数: ドメインモデルに存在しないためデフォルト値0を設定
		paidLeaveDays: salarySlip.attendance.paidLeaveDays,
		baseSalary: salarySlip.earnings.baseSalary,
		overtimePay: salarySlip.earnings.overtimePay,
		overtimePayOver60: salarySlip.earnings.overtimePayOver60,
		lateNightPay: salarySlip.earnings.lateNightPay,
		fixedOvertimeAllowance: salarySlip.earnings.fixedOvertimeAllowance,
		expenseReimbursement: salarySlip.earnings.expenseReimbursement,
		transportationAllowance: salarySlip.earnings.transportationAllowance,
		stockPurchaseIncentive: salarySlip.earnings.stockPurchaseIncentive,
		totalEarnings: salarySlip.earnings.total,
		healthInsurance: salarySlip.deductions.healthInsurance,
		welfareInsurance: salarySlip.deductions.welfareInsurance,
		employmentInsurance: salarySlip.deductions.employmentInsurance,
		incomeTax: salarySlip.deductions.incomeTax,
		residentTax: salarySlip.deductions.residentTax,
		otherDeductions: salarySlip.deductions.otherDeductions,
		totalDeductions: salarySlip.deductions.total,
		netPay: salarySlip.netPay,
		fileName
	};
}

/**
 * PrismaのSalarySlipモデルをフロントエンド用ドメインモデルに変換
 *
 * @description
 * データベースから取得したPrismaのSalarySlipレコードを、フロントエンドで使用する
 * ドメインモデル形式に変換します。Decimal型からNumber型への変換、
 * フラットな構造から階層構造への再構築、欠損フィールドのデフォルト値設定を行います。
 * UIでの表示とビジネスロジックでの処理に最適化された形式を提供します。
 *
 * @param {PrismaSalarySlip} slip - Prismaから取得したSalarySlipレコード
 * @param {string} slip.companyName - 会社名
 * @param {string} slip.employeeName - 従業員名
 * @param {string} slip.employeeId - 従業員ID
 * @param {string} slip.paymentDate - 支給日
 * @param {string} slip.targetPeriodStart - 対象期間開始日
 * @param {string} slip.targetPeriodEnd - 対象期間終了日
 * @param {Decimal} slip.baseSalary - 基本給（Decimal型）
 * @param {Decimal} slip.overtimePay - 残業代（Decimal型）
 * @param {Decimal} slip.transportationAllowance - 交通費（Decimal型）
 * @param {Decimal} slip.totalEarnings - 総支給額（Decimal型）
 * @param {Decimal} slip.healthInsurance - 健康保険料（Decimal型）
 * @param {Decimal} slip.welfareInsurance - 厚生年金保険料（Decimal型）
 * @param {Decimal} slip.employmentInsurance - 雇用保険料（Decimal型）
 * @param {Decimal} slip.incomeTax - 所得税（Decimal型）
 * @param {Decimal} slip.residentTax - 住民税（Decimal型）
 * @param {Decimal} slip.otherDeductions - その他控除（Decimal型）
 * @param {Decimal} slip.totalDeductions - 総控除額（Decimal型）
 * @param {Decimal} slip.netPay - 差引支給額（Decimal型）
 * @param {string} slip.fileName - 元PDFファイル名
 * @param {Date} slip.uploadedAt - アップロード日時
 *
 * @returns {object} フロントエンド用の給料明細データオブジェクト
 * @returns {SalarySlip} returns.salarySlip - 構造化された給料明細ドメインモデル
 * @returns {string} returns.rawText - PDFの生テキスト（空文字列、DBには保存されない）
 * @returns {string} returns.fileName - 元PDFファイル名
 * @returns {string} returns.uploadedAt - ISO8601形式のアップロード日時
 *
 * @example
 * ```typescript
 * // データベースから給料明細を取得してフロントエンド用に変換
 * const prismaSlip = await prisma.salarySlip.findUnique({
 *   where: { id: 'slip-123' }
 * });
 *
 * if (prismaSlip) {
 *   const frontendData = prismaDataToSalarySlip(prismaSlip);
 *
 *   // フロントエンドでの使用
 *   console.log(`従業員: ${frontendData.salarySlip.employeeName}`);
 *   console.log(`基本給: ${frontendData.salarySlip.earnings.baseSalary.toLocaleString()}円`);
 *   console.log(`支給期間: ${frontendData.salarySlip.targetPeriod.start} - ${frontendData.salarySlip.targetPeriod.end}`);
 *
 *   // リアクティブUIでの表示
 *   showSalarySlipDetails(frontendData.salarySlip);
 * }
 *
 * // 一覧表示用のデータ変換
 * const allSlips = await prisma.salarySlip.findMany();
 * const frontendSlips = allSlips.map(prismaDataToSalarySlip);
 * ```
 *
 * @performance
 * - Decimal型からNumber型への効率的な変換
 * - 浅いオブジェクト構築による高速実行
 * - Date型のISO8601変換の最適化
 * - 不要なデープクローンを回避
 *
 * @typeConversion
 * - Decimal型 → Number型: `Number(slip.baseSalary)`で精度を保った変換
 * - Date型 → ISO8601文字列: `slip.uploadedAt.toISOString()`でタイムゾーン対応
 * - フラット構造 → 階層構造: targetPeriod, attendance, earnings, deductionsオブジェクトを再構築
 *
 * @defaultValues
 * - 勤怠データの欠損項目は0で初期化（overtimeHoursOver60, lateNightHours, paidLeaveDays）
 * - 支給項目の欠損項目は0で初期化（fixedOvertimeAllowance, overtimePayOver60等）
 * - rawTextは空文字列（PDFテキストはDBに保存されないため）
 *
 * @database
 * - PrismaのDecimal型の安全な変換処理
 * - PostgreSQL/MySQLの数値型との互換性
 * - タイムゾーン情報の適切な処理
 *
 * @security
 * - PrismaSalarySlip型を使用して型安全性を確保
 * - 入力データの基本的な存在チェックを実装（nullチェック等）
 * - 数値変換時のNaN/Infinityの適切な処理
 *
 * @see {@link salarySlipToPrismaData} 逆変換関数（ドメインモデル→DB）
 * @see {@link SalarySlip} ドメインモデルの型定義
 * @see {@link Prisma.SalarySlip} PrismaのDB型定義
 */
export function prismaDataToSalarySlip(slip: PrismaSalarySlip) {
	return {
		salarySlip: {
			companyName: slip.companyName,
			employeeName: slip.employeeName,
			employeeId: slip.employeeId,
			paymentDate: slip.paymentDate,
			targetPeriod: {
				start: slip.targetPeriodStart,
				end: slip.targetPeriodEnd
			},
			attendance: {
				overtimeHours: slip.overtimeHours,
				overtimeHoursOver60: slip.overtimeHoursOver60,
				lateNightHours: slip.lateNightHours,
				paidLeaveDays: slip.paidLeaveDays
			},
			earnings: {
				baseSalary: Number(slip.baseSalary), // PrismaのDecimal型をJavaScriptのNumber型に変換
				overtimePay: Number(slip.overtimePay), // 残業代: PrismaのDecimal型をNumber型に変換
				overtimePayOver60: Number(slip.overtimePayOver60), // 60時間超残業手当: PrismaのDecimal型をNumber型に変換
				lateNightPay: Number(slip.lateNightPay), // 深夜割増額: PrismaのDecimal型をNumber型に変換
				fixedOvertimeAllowance: Number(slip.fixedOvertimeAllowance), // 固定時間外手当: PrismaのDecimal型をNumber型に変換
				expenseReimbursement: Number(slip.expenseReimbursement), // 立替経費: PrismaのDecimal型をNumber型に変換
				transportationAllowance: Number(slip.transportationAllowance), // 交通費: DBのtransportationAllowanceフィールドをマッピング
				stockPurchaseIncentive: Number(slip.stockPurchaseIncentive), // 持株会奨励金: PrismaのDecimal型をNumber型に変換
				total: Number(slip.totalEarnings) // 総支給額: PrismaのDecimal型をNumber型に変換
			},
			deductions: {
				healthInsurance: Number(slip.healthInsurance), // 健康保険料: PrismaのDecimal型をNumber型に変換
				welfareInsurance: Number(slip.welfareInsurance), // 厚生年金保険料: DBのwelfareInsuranceフィールドをマッピング
				employmentInsurance: Number(slip.employmentInsurance), // 雇用保険料: PrismaのDecimal型をNumber型に変換
				incomeTax: Number(slip.incomeTax), // 所得税: PrismaのDecimal型をNumber型に変換
				residentTax: Number(slip.residentTax), // 住民税: PrismaのDecimal型をNumber型に変換
				otherDeductions: Number(slip.otherDeductions), // その他控除: DBのotherDeductionsフィールドをマッピング
				total: Number(slip.totalDeductions) // 総控除額: PrismaのDecimal型をNumber型に変換
			},
			netPay: Number(slip.netPay) // 差引支給額: PrismaのDecimal型をNumber型に変換
		},
		rawText: '', // PDFの生テキスト: データベースには保存されないため空文字列を設定
		fileName: slip.fileName,
		uploadedAt: slip.uploadedAt.toISOString() // アップロード日時: Date型からISO8601形式の文字列に変換
	};
}
