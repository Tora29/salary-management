<script lang="ts">
	/**
	 * パスワード強度インジケーターコンポーネント
	 * Svelte 5 $derivedを使用した効率的な強度計算
	 */
	import type { PasswordStrengthLevel, PasswordStrengthResult } from '../model/melt-ui-common';

	interface Props {
		password: string;
		class?: string;
		showDetails?: boolean;
	}

	const { password, class: className = '', showDetails = true }: Props = $props();

	/**
	 * パスワード強度を計算
	 */
	const strengthResult = $derived.by((): PasswordStrengthResult => {
		const checks = {
			hasMinLength: password.length >= 8,
			hasUpperCase: /[A-Z]/.test(password),
			hasLowerCase: /[a-z]/.test(password),
			hasNumber: /[0-9]/.test(password),
			hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
		};

		let score = 0;
		let level: PasswordStrengthLevel = 'weak';

		// スコア計算
		if (checks.hasMinLength) {
			score += 20;
		}
		if (checks.hasUpperCase) {
			score += 20;
		}
		if (checks.hasLowerCase) {
			score += 20;
		}
		if (checks.hasNumber) {
			score += 20;
		}
		if (checks.hasSpecialChar) {
			score += 20;
		}

		// レベル判定
		if (score >= 80) {
			level = 'strong';
		} else if (score >= 60) {
			level = 'medium';
		} else {
			level = 'weak';
		}

		return {
			level,
			score,
			checks
		};
	});

	/**
	 * レベルに応じたカラークラスを取得
	 */
	const levelColorClass = $derived(
		strengthResult.level === 'strong'
			? 'bg-green-500'
			: strengthResult.level === 'medium'
				? 'bg-yellow-500'
				: 'bg-red-500'
	);

	/**
	 * レベルに応じたテキストを取得
	 */
	const levelText = $derived(
		strengthResult.level === 'strong' ? '強い' : strengthResult.level === 'medium' ? '普通' : '弱い'
	);
</script>

{#if password}
	<div class="password-strength {className}">
		<div class="flex items-center justify-between mb-2">
			<span class="text-sm font-medium text-gray-700">パスワード強度</span>
			<span
				class="text-sm font-medium {strengthResult.level === 'strong'
					? 'text-green-600'
					: strengthResult.level === 'medium'
						? 'text-yellow-600'
						: 'text-red-600'}"
			>
				{levelText}
			</span>
		</div>

		<!-- プログレスバー -->
		<div class="w-full bg-gray-200 rounded-full h-2 mb-3">
			<div
				class="h-2 rounded-full transition-all duration-300 {levelColorClass}"
				style:width="{strengthResult.score}%"
			></div>
		</div>

		<!-- 詳細チェックリスト -->
		{#if showDetails}
			<ul class="space-y-1 text-sm">
				<li
					class="flex items-center {strengthResult.checks.hasMinLength
						? 'text-green-600'
						: 'text-gray-400'}"
				>
					<span class="mr-2">{strengthResult.checks.hasMinLength ? '✓' : '○'}</span>
					8文字以上
				</li>
				<li
					class="flex items-center {strengthResult.checks.hasUpperCase
						? 'text-green-600'
						: 'text-gray-400'}"
				>
					<span class="mr-2">{strengthResult.checks.hasUpperCase ? '✓' : '○'}</span>
					大文字を含む
				</li>
				<li
					class="flex items-center {strengthResult.checks.hasLowerCase
						? 'text-green-600'
						: 'text-gray-400'}"
				>
					<span class="mr-2">{strengthResult.checks.hasLowerCase ? '✓' : '○'}</span>
					小文字を含む
				</li>
				<li
					class="flex items-center {strengthResult.checks.hasNumber
						? 'text-green-600'
						: 'text-gray-400'}"
				>
					<span class="mr-2">{strengthResult.checks.hasNumber ? '✓' : '○'}</span>
					数字を含む
				</li>
				<li
					class="flex items-center {strengthResult.checks.hasSpecialChar
						? 'text-green-600'
						: 'text-gray-400'}"
				>
					<span class="mr-2">{strengthResult.checks.hasSpecialChar ? '✓' : '○'}</span>
					特殊文字を含む（任意）
				</li>
			</ul>
		{/if}
	</div>
{/if}
