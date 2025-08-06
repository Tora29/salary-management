-- CreateEnum

-- AlterTable: Add new detailed earnings fields
ALTER TABLE "SalarySlip" ADD COLUMN "overtimePayOver60" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "SalarySlip" ADD COLUMN "lateNightPay" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "SalarySlip" ADD COLUMN "fixedOvertimeAllowance" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "SalarySlip" ADD COLUMN "expenseReimbursement" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "SalarySlip" ADD COLUMN "stockPurchaseIncentive" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Add missing attendance fields if they don't exist
ALTER TABLE "SalarySlip" ADD COLUMN IF NOT EXISTS "overtimeHoursOver60" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "SalarySlip" ADD COLUMN IF NOT EXISTS "lateNightHours" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "SalarySlip" ADD COLUMN IF NOT EXISTS "paidLeaveDays" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Data migration: Move existing otherAllowances data to expenseReimbursement
-- (This is a simplified migration - in production you might want to split the data differently)
UPDATE "SalarySlip" SET "expenseReimbursement" = "otherAllowances" WHERE "otherAllowances" > 0;

-- Drop the old otherAllowances column
ALTER TABLE "SalarySlip" DROP COLUMN "otherAllowances";