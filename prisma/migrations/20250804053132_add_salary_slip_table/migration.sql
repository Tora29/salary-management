-- CreateTable
CREATE TABLE "public"."SalarySlip" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "paymentDate" TEXT NOT NULL,
    "targetPeriodStart" TEXT NOT NULL,
    "targetPeriodEnd" TEXT NOT NULL,
    "overtimeHours" DOUBLE PRECISION NOT NULL,
    "holidayWorkDays" INTEGER NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "overtimePay" DECIMAL(10,2) NOT NULL,
    "transportationAllowance" DECIMAL(10,2) NOT NULL,
    "otherAllowances" DECIMAL(10,2) NOT NULL,
    "totalEarnings" DECIMAL(10,2) NOT NULL,
    "healthInsurance" DECIMAL(10,2) NOT NULL,
    "welfareInsurance" DECIMAL(10,2) NOT NULL,
    "employmentInsurance" DECIMAL(10,2) NOT NULL,
    "incomeTax" DECIMAL(10,2) NOT NULL,
    "residentTax" DECIMAL(10,2) NOT NULL,
    "otherDeductions" DECIMAL(10,2) NOT NULL,
    "totalDeductions" DECIMAL(10,2) NOT NULL,
    "netPay" DECIMAL(10,2) NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalarySlip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalarySlip_paymentDate_idx" ON "public"."SalarySlip"("paymentDate");

-- CreateIndex
CREATE INDEX "SalarySlip_employeeId_idx" ON "public"."SalarySlip"("employeeId");
