import type { Component } from 'svelte';

/**
 * ダッシュボードカードコンポーネントのプロパティ定義
 * @interface CardProps
 * @description 統計情報や重要な数値を表示するためのカードコンポーネントで使用されるプロパティ
 */
export interface CardProps {
  /**
   * カードのタイトル
   * @example "今月の給料", "年収累計"
   */
  title: string;
  
  /**
   * 表示する値（通貨や数値など）
   * @example "¥250,000", "12件"
   */
  value: string;
  
  /**
   * 補足情報（オプション）
   * @example "前月比 +10%", "今年の合計"
   */
  subtitle?: string;
  
  /**
   * カードに表示するアイコンコンポーネント
   * @description Lucide-svelteなどのアイコンライブラリのコンポーネントを使用
   * @example DollarSign, TrendingUp
   */
  icon: Component;
}
