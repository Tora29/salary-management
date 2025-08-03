<script lang="ts">
  import { DollarSign, TrendingUp, Wallet, BarChart3 } from '@lucide/svelte';
  import DashboardCard from '$lib/components/DashboardCard.svelte';
  import { dummyData } from '$lib/data/dummy';
  import { formatCurrency } from '$lib/utils/format';
</script>

<svelte:head>
  <title>給料・資産管理ダッシュボード</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <h1 class="text-2xl font-bold text-gray-900">給料・資産管理</h1>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Dashboard Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="今月の給料"
        value={formatCurrency(dummyData.currentMonthSalary)}
        icon={DollarSign}
      />
      <DashboardCard
        title="年収累計"
        value={formatCurrency(dummyData.yearlyIncome)}
        subtitle="今年の合計"
        icon={TrendingUp}
      />
      <DashboardCard
        title="総資産額"
        value={formatCurrency(dummyData.totalAssets)}
        subtitle={`預金: ${formatCurrency(dummyData.depositBalance)}`}
        icon={Wallet}
      />
      <DashboardCard
        title="株式評価額"
        value={formatCurrency(dummyData.stockValuation)}
        subtitle={`${dummyData.stocks.length}銘柄保有`}
        icon={BarChart3}
      />
    </div>

    <!-- Stock Portfolio Preview -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">保有株式</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                銘柄コード
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                銘柄名
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                保有数
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                取得単価
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                現在値
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                評価額
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each dummyData.stocks as stock}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {stock.symbol}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {stock.name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {stock.quantity}株
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatCurrency(stock.purchasePrice)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatCurrency(stock.currentPrice)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(stock.value)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="bg-white mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <p class="text-center text-sm text-gray-500">
        &copy; 2024 給料・資産管理アプリ
      </p>
    </div>
  </footer>
</div>
