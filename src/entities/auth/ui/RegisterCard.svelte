<script lang="ts">
	import { Eye, EyeOff } from '@lucide/svelte';

	import Button from '$shared/components/ui/Button.svelte';
	import Card from '$shared/components/ui/Card.svelte';
	import Checkbox from '$shared/components/ui/Checkbox.svelte';
	import Input from '$shared/components/ui/Input.svelte';
	import Label from '$shared/components/ui/Label.svelte';
	import Link from '$shared/components/ui/Link.svelte';
	import PasswordStrength from '$shared/components/ui/PasswordStrength.svelte';
	import { ROUTES } from '$shared/consts/routes';

	import type { RegistrationCardProps } from '../model/register-card';

	let {
		email = $bindable(''),
		password = $bindable(''),
		confirmPassword = $bindable(''),
		agreedToTerms = $bindable(false),
		emailError,
		passwordError,
		confirmPasswordError,
		agreedToTermsError,
		onSubmit,
		onEmailBlur,
		onPasswordBlur,
		onConfirmPasswordBlur,
		loading = false
	}: RegistrationCardProps = $props();

	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	function togglePasswordVisibility(): void {
		showPassword = !showPassword;
	}

	function toggleConfirmPasswordVisibility(): void {
		showConfirmPassword = !showConfirmPassword;
	}

	function handleSubmit(e: Event): void {
		e.preventDefault();
		onSubmit();
	}
</script>

<Card padding="lg" shadow="lg" class="max-w-md mx-auto">
	<form onsubmit={handleSubmit} class="space-y-6">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-semibold text-gray-900">新規アカウント登録</h1>
			<p class="mt-2 text-sm text-gray-600">アカウントを作成して、サービスをご利用ください</p>
		</div>

		<div class="form-group">
			<Label for="email" required>メールアドレス</Label>
			<Input
				id="email"
				name="email"
				type="email"
				bind:value={email}
				onblur={onEmailBlur}
				placeholder="example@example.com"
				autocomplete="email"
				required
				error={!!emailError}
				disabled={loading}
				aria-label="メールアドレス"
				aria-describedby={emailError ? 'email-error' : undefined}
			/>
			{#if emailError}
				<span id="email-error" class="form-error">{emailError}</span>
			{/if}
		</div>

		<div class="form-group">
			<Label for="password" required>パスワード</Label>
			<div class="relative">
				<Input
					id="password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					bind:value={password}
					onblur={onPasswordBlur}
					placeholder="8文字以上、大小英数字を含む"
					autocomplete="new-password"
					required
					error={!!passwordError}
					disabled={loading}
					aria-label="パスワード"
					aria-describedby={passwordError ? 'password-error' : 'password-requirements'}
				/>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					class="absolute right-3 top-1/2 -translate-y-1/2 p-1 btn-icon-only"
					onclick={togglePasswordVisibility}
					aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
				>
					{#if showPassword}
						<EyeOff size={20} />
					{:else}
						<Eye size={20} />
					{/if}
				</Button>
			</div>
			{#if passwordError}
				<span id="password-error" class="form-error">{passwordError}</span>
			{/if}
			{#if password}
				<PasswordStrength {password} />
			{/if}
		</div>

		<div class="form-group">
			<Label for="confirmPassword" required>パスワード（確認）</Label>
			<div class="relative">
				<Input
					id="confirmPassword"
					name="confirmPassword"
					type={showConfirmPassword ? 'text' : 'password'}
					bind:value={confirmPassword}
					onblur={onConfirmPasswordBlur}
					placeholder="パスワードを再入力"
					autocomplete="new-password"
					required
					error={!!confirmPasswordError}
					disabled={loading}
					aria-label="パスワード（確認）"
					aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
				/>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					class="absolute right-3 top-1/2 -translate-y-1/2 p-1 btn-icon-only"
					onclick={toggleConfirmPasswordVisibility}
					aria-label={showConfirmPassword ? 'パスワードを非表示' : 'パスワードを表示'}
				>
					{#if showConfirmPassword}
						<EyeOff size={20} />
					{:else}
						<Eye size={20} />
					{/if}
				</Button>
			</div>
			{#if confirmPasswordError}
				<span id="confirm-password-error" class="form-error">{confirmPasswordError}</span>
			{/if}
		</div>

		<div class="form-group">
			<div class="flex items-start gap-3">
				<Checkbox bind:checked={agreedToTerms} disabled={loading} ariaLabel="利用規約に同意する" />
				<div class="flex-1">
					<label class="text-sm font-normal text-gray-700">
						<Link
							href={ROUTES.TERMS}
							target="_blank"
							class="text-primary-600 hover:text-primary-700"
						>
							利用規約
						</Link>
						および
						<Link
							href={ROUTES.PRIVACY}
							target="_blank"
							class="text-primary-600 hover:text-primary-700"
						>
							プライバシーポリシー
						</Link>
						に同意します
					</label>
					{#if agreedToTermsError}
						<span id="terms-error" class="form-error block mt-1">{agreedToTermsError}</span>
					{/if}
				</div>
			</div>
		</div>

		<Button
			type="submit"
			variant="primary"
			size="lg"
			class="w-full"
			{loading}
			disabled={loading || !agreedToTerms}
			aria-label="登録する"
		>
			{loading ? '登録中...' : 'アカウントを作成'}
		</Button>

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600">
				既にアカウントをお持ちの方は
				<Link href={ROUTES.LOGIN} class="font-medium">ログイン</Link>
			</p>
		</div>
	</form>
</Card>
