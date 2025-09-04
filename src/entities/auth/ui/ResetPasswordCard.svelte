<script lang="ts">
	import { Eye, EyeOff } from '@lucide/svelte';

	import Button from '$shared/components/ui/Button.svelte';
	import Card from '$shared/components/ui/Card.svelte';
	import Input from '$shared/components/ui/Input.svelte';
	import Label from '$shared/components/ui/Label.svelte';
	import PasswordStrength from '$shared/components/ui/PasswordStrength.svelte';

	import type { ResetPasswordCardProps } from '../model/password-reset';

	let {
		password = $bindable(''),
		confirmPassword = $bindable(''),
		passwordError,
		confirmPasswordError,
		passwordStrength,
		onPasswordChange,
		onSubmit,
		loading = false
	}: ResetPasswordCardProps = $props();

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

	function handlePasswordInput(e: Event): void {
		const target = e.target as HTMLInputElement;
		password = target.value;
		onPasswordChange(password);
	}
</script>

<Card padding="lg" shadow="lg" class="max-w-md mx-auto">
	<form onsubmit={handleSubmit} class="space-y-6">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-semibold text-gray-900">新しいパスワードを設定</h1>
			<p class="mt-2 text-sm text-gray-600">安全なパスワードを設定してください</p>
		</div>

		<div class="form-group">
			<Label for="password" required>新しいパスワード</Label>
			<div class="relative">
				<Input
					id="password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					value={password}
					oninput={handlePasswordInput}
					placeholder="••••••••"
					autocomplete="new-password"
					required
					error={!!passwordError}
					disabled={loading}
					aria-label="新しいパスワード"
					aria-describedby={passwordError ? 'password-error' : undefined}
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

			{#if passwordStrength && password}
				<PasswordStrength {password} showDetails={false} class="mt-2" />
			{/if}
		</div>

		<div class="form-group">
			<Label for="confirmPassword" required>パスワードを確認</Label>
			<div class="relative">
				<Input
					id="confirmPassword"
					name="confirmPassword"
					type={showConfirmPassword ? 'text' : 'password'}
					bind:value={confirmPassword}
					placeholder="••••••••"
					autocomplete="new-password"
					required
					error={!!confirmPasswordError}
					disabled={loading}
					aria-label="パスワードを確認"
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

		<Button
			type="submit"
			variant="primary"
			size="lg"
			class="w-full"
			{loading}
			aria-label="パスワードをリセット"
		>
			{loading ? 'リセット中...' : 'パスワードをリセット'}
		</Button>
	</form>
</Card>
