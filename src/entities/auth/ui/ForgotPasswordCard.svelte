<script lang="ts">
	import Button from '$shared/components/ui/Button.svelte';
	import Card from '$shared/components/ui/Card.svelte';
	import Input from '$shared/components/ui/Input.svelte';
	import Label from '$shared/components/ui/Label.svelte';
	import Link from '$shared/components/ui/Link.svelte';
	import { ROUTES } from '$shared/consts/routes';

	import type { ForgotPasswordCardProps } from '../model/password-reset';

	let {
		email = $bindable(''),
		emailError,
		onSubmit,
		loading = false
	}: ForgotPasswordCardProps = $props();

	function handleSubmit(e: Event): void {
		e.preventDefault();
		onSubmit();
	}
</script>

<Card padding="lg" shadow="lg" class="max-w-md mx-auto">
	<form onsubmit={handleSubmit} class="space-y-6">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-semibold text-gray-900">パスワードをリセット</h1>
			<p class="mt-2 text-sm text-gray-600">登録されているメールアドレスを入力してください</p>
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

		<Button
			type="submit"
			variant="primary"
			size="lg"
			class="w-full"
			{loading}
			aria-label="リセットメールを送信"
		>
			{loading ? '送信中...' : 'リセットメールを送信'}
		</Button>

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600">
				パスワードを思い出しましたか？
				<Link href={ROUTES.LOGIN} class="font-medium">ログインに戻る</Link>
			</p>
		</div>
	</form>
</Card>
