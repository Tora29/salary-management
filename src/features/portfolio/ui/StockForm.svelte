<script lang="ts">
	import type { StockFormProps, StockFormData } from '../model';
	import { Form } from '$lib/components/form';
	import { FormGrid } from '$lib/components/form-grid';
	import { FormField } from '$lib/components/form-field';
	import { ButtonGroup } from '$lib/components/button-group';
	import { Button } from '$lib/components/button';

	let { onSubmit, stock, isSubmitting = false }: StockFormProps = $props();

	let formData = $state<StockFormData>({
		symbol: stock?.symbol || '',
		name: stock?.name || '',
		quantity: stock?.quantity || 0,
		purchasePrice: stock?.purchasePrice || 0
	});

	let errors = $state<Partial<Record<keyof StockFormData, string>>>({});

	/**
	 * フォームのバリデーション
	 */
	function validateForm(): boolean {
		const newErrors: Partial<Record<keyof StockFormData, string>> = {};

		if (!formData.symbol.trim()) {
			newErrors.symbol = '証券コードを入力してください';
		} else if (!/^\d{4}$/.test(formData.symbol.trim())) {
			newErrors.symbol = '証券コードは4桁の数字で入力してください';
		}

		if (!formData.name.trim()) {
			newErrors.name = '銘柄名を入力してください';
		}

		if (formData.quantity <= 0) {
			newErrors.quantity = '数量は1以上で入力してください';
		}

		if (formData.purchasePrice <= 0) {
			newErrors.purchasePrice = '購入単価は0より大きい値を入力してください';
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
				name: formData.name.trim(),
				quantity: formData.quantity,
				purchasePrice: formData.purchasePrice
			});

			// 新規追加の場合はフォームをリセット
			if (!stock) {
				formData = {
					symbol: '',
					name: '',
					quantity: 0,
					purchasePrice: 0
				};
			}
		}
	}

	/**
	 * フォームのリセット
	 */
	function handleReset() {
		formData = {
			symbol: stock?.symbol || '',
			name: stock?.name || '',
			quantity: stock?.quantity || 0,
			purchasePrice: stock?.purchasePrice || 0
		};
		errors = {};
	}
</script>

<Form onSubmit={handleSubmit}>
	<FormGrid cols={2}>
		<FormField
			id="symbol"
			label="証券コード"
			required
			type="text"
			bind:value={formData.symbol}
			placeholder="例: 7203"
			disabled={!!stock || isSubmitting}
			error={errors.symbol}
		/>

		<FormField
			id="name"
			label="銘柄名"
			required
			type="text"
			bind:value={formData.name}
			placeholder="例: トヨタ自動車"
			disabled={isSubmitting}
			error={errors.name}
		/>

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
	</FormGrid>

	<ButtonGroup>
		<Button type="button" variant="outline" onclick={handleReset} disabled={isSubmitting}>
			リセット
		</Button>
		<Button type="submit" disabled={isSubmitting}>
			{isSubmitting ? '処理中...' : stock ? '更新' : '追加'}
		</Button>
	</ButtonGroup>
</Form>
