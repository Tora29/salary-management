<script lang="ts">
	import { Eye, EyeOff } from '@lucide/svelte';

	import Button from '$shared/components/ui/Button.svelte';
	import Card from '$shared/components/ui/Card.svelte';
	import Input from '$shared/components/ui/Input.svelte';
	import Label from '$shared/components/ui/Label.svelte';
	import Link from '$shared/components/ui/Link.svelte';
	import { ROUTES } from '$shared/consts/routes';

	import type { LoginCardProps } from '../model/login-card';

	let {
		email = $bindable(''),
		password = $bindable(''),
		emailError,
		passwordError,
		onSubmit,
		loading = false
	}: LoginCardProps = $props();

	let showPassword = $state(false);

	function togglePasswordVisibility(): void {
		showPassword = !showPassword;
	}

	function handleSubmit(e: Event): void {
		e.preventDefault();
		onSubmit();
	}
</script>

<Card padding="lg" shadow="lg" class="max-w-md mx-auto">
	<form onsubmit={handleSubmit} class="space-y-6">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-semibold text-gray-900">ログイン</h1>
			<p class="mt-2 text-sm text-gray-600">アカウントにログインしてください</p>
		</div>

		<div class="form-group">
			<Label for="email" required>メールアドレス</Label>
			<Input
				id="email"
				name="email"
				type="email"
				bind:value={email}
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
			<div class="flex items-center justify-between">
				<Label for="password" required>パスワード</Label>
				<Link href={ROUTES.FORGOT_PASSWORD} class="text-sm">パスワードを忘れた方</Link>
			</div>
			<div class="relative">
				<Input
					id="password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					bind:value={password}
					placeholder="••••••••"
					autocomplete="current-password"
					required
					error={!!passwordError}
					disabled={loading}
					aria-label="パスワード"
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
		</div>

		<Button
			type="submit"
			variant="primary"
			size="lg"
			class="w-full"
			{loading}
			aria-label="ログインする"
		>
			{loading ? 'ログイン中...' : 'ログイン'}
		</Button>

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600">
				アカウントをお持ちでない方は
				<Link href={ROUTES.REGISTER} class="font-medium">新規登録</Link>
			</p>
		</div>
	</form>
</Card>
