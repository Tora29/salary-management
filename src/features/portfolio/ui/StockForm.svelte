<script lang="ts">
	import { Button } from '$lib/components/button';
	import { ButtonGroup } from '$lib/components/button-group';
	import { FormField } from '$lib/components/form-field';

	import type { StockFormData, StockFormProps } from '../model';

	let { onSubmit, stock, isSubmitting = false }: StockFormProps = $props();

	let formData = $state<StockFormData>({
		symbol: stock?.symbol || '',
		quantity: stock?.quantity || 0,
		purchasePrice: stock?.purchasePrice || 0
	});

	let stockName = $state<string>(stock?.name || '');
	let isLoadingStockName = $state<boolean>(false);

	let errors = $state<Partial<Record<keyof (StockFormData & { name: string }), string>>>({});

	/**
	 * 証券コードから銘柄名を自動取得
	 */
	async function fetchStockName(symbol: string) {
		if (!/^\d{4}$/.test(symbol)) {
			stockName = '';
			return;
		}

		isLoadingStockName = true;
		try {
			console.log(`🔍 銘柄情報を取得中: ${symbol}`);
			const response = await fetch(`/api/portfolio/info/${symbol}`);

			if (response.ok) {
				const stockInfo = await response.json();
				stockName = stockInfo.name;
				console.log(`✅ 銘柄情報を取得: ${symbol} = ${stockInfo.name}`);

				// 成功時はエラーをクリア
				if (errors.symbol || errors.name) {
					const { symbol: _, name: __, ...rest } = errors;
					errors = rest;
				}
			} else {
				console.warn(`⚠️ 銘柄が見つかりません: ${symbol} (${response.status})`);
				stockName = '';
				errors.symbol = '銘柄が見つかりません（証券コードを確認してください）';
			}
		} catch (error) {
			console.error('🚨 銘柄情報の取得に失敗:', error);
			stockName = '';
			errors.symbol = 'ネットワークエラーが発生しました';
		} finally {
			isLoadingStockName = false;
		}
	}

	/**
	 * 全角数字を半角数字に変換
	 */
	function convertToHalfWidth(str: string): string {
		return str.replace(/[０-９]/g, (char) => {
			return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
		});
	}

	/**
	 * 証券コード入力時の処理（リアルタイム変換）
	 */
	function handleSymbolInput() {
		// 全角数字を半角に変換
		const converted = convertToHalfWidth(formData.symbol);
		if (converted !== formData.symbol) {
			formData.symbol = converted;
		}

		// 入力中はエラーをクリア
		if (errors.symbol) {
			const { symbol, ...rest } = errors;
			errors = rest;
		}
		if (errors.name) {
			const { name, ...rest } = errors;
			errors = rest;
		}
	}

	/**
	 * 証券コードのblur時処理（エラーチェックと銘柄名取得）
	 */
	async function handleSymbolBlur() {
		const symbol = formData.symbol.trim();

		if (!symbol) {
			stockName = '';
			return;
		}

		if (!/^\d{4}$/.test(symbol)) {
			errors.symbol = '証券コードは4桁の数字で入力してください';
			stockName = '';
			return;
		}

		// 4桁の数字の場合、銘柄名を取得
		await fetchStockName(symbol);
	}

	/**
	 * フォームのバリデーション
	 */
	function validateForm(): boolean {
		const newErrors: Partial<Record<keyof (StockFormData & { name: string }), string>> = {};

		if (!formData.symbol.trim()) {
			newErrors.symbol = '証券コードを入力してください';
		} else if (!/^\d{4}$/.test(formData.symbol.trim())) {
			newErrors.symbol = '証券コードは4桁の数字で入力してください';
		}

		if (!stockName.trim()) {
			newErrors.name = '有効な証券コードを入力してください';
		}

		const quantity = Number(formData.quantity);
		if (isNaN(quantity) || quantity <= 0) {
			newErrors.quantity = '数量は1以上の数値で入力してください';
		}

		const purchasePrice = Number(formData.purchasePrice);
		if (isNaN(purchasePrice) || purchasePrice <= 0) {
			newErrors.purchasePrice = '購入単価は0より大きい数値を入力してください';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	/**
	 * フォーム送信処理
	 */
	function handleSubmit(event: Event) {
		event.preventDefault();

		if (validateForm()) {
			onSubmit({
				symbol: formData.symbol.trim(),
				quantity: formData.quantity,
				purchasePrice: formData.purchasePrice
			});

			// 新規追加の場合はフォームをリセット
			if (!stock) {
				formData = {
					symbol: '',
					quantity: 0,
					purchasePrice: 0
				};
				stockName = '';
			}
		}
	}

	/**
	 * フォームのリセット
	 */
	function handleReset() {
		formData = {
			symbol: stock?.symbol || '',
			quantity: stock?.quantity || 0,
			purchasePrice: stock?.purchasePrice || 0
		};
		stockName = stock?.name || '';
		errors = {};
	}
</script>

<form onsubmit={handleSubmit} class="grid grid-cols-1 gap-6 sm:grid-cols-2">
	<FormField
		id="symbol"
		label="証券コード"
		required
		type="text"
		bind:value={formData.symbol}
		placeholder="例: 7203"
		disabled={!!stock || isSubmitting}
		error={errors.symbol}
		oninput={handleSymbolInput}
		onblur={handleSymbolBlur}
	/>

	<FormField
		id="stockName"
		label="銘柄名"
		type="text"
		value={stockName}
		placeholder="証券コードを入力すると自動表示"
		disabled={true}
		error={errors.name}
	/>
	{#if isLoadingStockName}
		<div class="col-span-full flex items-center justify-center space-x-2 py-2">
			<div
				class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
			></div>
			<span class="text-sm text-gray-600">銘柄情報を取得中...</span>
		</div>
	{/if}

	<FormField
		id="quantity"
		label="保有数量"
		required
		type="number"
		bind:value={formData.quantity}
		placeholder="例: 100"
		min="1"
		disabled={isSubmitting}
		error={errors.quantity}
	/>

	<FormField
		id="purchasePrice"
		label="購入単価（円）"
		required
		type="number"
		bind:value={formData.purchasePrice}
		placeholder="例: 2500"
		step="0.01"
		min="0.01"
		disabled={isSubmitting}
		error={errors.purchasePrice}
	/>

	<ButtonGroup>
		<Button type="button" variant="outline" onclick={handleReset} disabled={isSubmitting}>
			リセット
		</Button>
		<Button type="submit" disabled={isSubmitting}>
			{isSubmitting ? '処理中...' : stock ? '更新' : '追加'}
		</Button>
	</ButtonGroup>
</form>
