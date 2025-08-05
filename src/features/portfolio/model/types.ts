import type { Stock } from '$entities/dashboard/model';

/**
 * 株式ポートフォリオビューのプロパティ
 */
export interface PortfolioViewProps {
	/** 初期表示する株式データ */
	initialStocks?: Stock[];
	/** エラーメッセージ */
	error?: string | null | undefined;
}

/**
 * 株式フォームの入力データ
 */
export interface StockFormData {
	/** 証券コード */
	symbol: string;
	/** 銘柄名 */
	name: string;
	/** 保有数量 */
	quantity: number;
	/** 購入単価 */
	purchasePrice: number;
}

/**
 * 株式フォームのプロパティ
 */
export interface StockFormProps {
	/** フォーム送信時のコールバック */
	onSubmit: (data: StockFormData) => void;
	/** 編集対象の株式データ（編集モード時） */
	stock?: Stock | undefined;
	/** フォームの送信中状態 */
	isSubmitting?: boolean;
}

/**
 * 株式リストのプロパティ
 */
export interface StockListProps {
	/** 表示する株式データの配列 */
	stocks: Stock[];
	/** 編集ボタンクリック時のコールバック */
	onEdit: (stock: Stock) => void;
	/** 削除ボタンクリック時のコールバック */
	onDelete: (symbol: string) => void;
	/** 株価更新時のコールバック */
	onPricesUpdate: (updatedStocks: Stock[]) => void;
}
