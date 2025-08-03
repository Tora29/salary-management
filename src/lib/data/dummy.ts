export const dummyData = {
  currentMonthSalary: 320000,
  yearlyIncome: 3840000,
  depositBalance: 2500000,
  stockValuation: 1850000,
  stocks: [
    {
      symbol: '7203',
      name: 'トヨタ自動車',
      quantity: 100,
      purchasePrice: 2100,
      currentPrice: 2250,
      value: 225000,
    },
    {
      symbol: '9984',
      name: 'ソフトバンクグループ',
      quantity: 50,
      purchasePrice: 6800,
      currentPrice: 7200,
      value: 360000,
    },
    {
      symbol: '6758',
      name: 'ソニーグループ',
      quantity: 30,
      purchasePrice: 11500,
      currentPrice: 12100,
      value: 363000,
    },
  ],
  totalAssets: 0, // 計算で設定
};

dummyData.totalAssets = dummyData.depositBalance + dummyData.stockValuation;