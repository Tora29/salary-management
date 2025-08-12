<script lang="ts">
	import Input from '$shared/components/ui/Input.svelte';
	import Button from '$shared/components/ui/Button.svelte';
	import Alert from '$shared/components/ui/Alert.svelte';
	import AuthCard from '$entities/auth/ui/AuthCard.svelte';
	import RememberMeCheckbox from '$entities/auth/ui/RememberMeCheckbox.svelte';
	import { useLoginForm } from '../composable/useLoginForm.svelte';
	import { Mail, Lock } from '@lucide/svelte';

	const loginForm = useLoginForm();
	const { formData, errors, isSubmitting, authError } = loginForm;

	async function handleSubmit(e: Event) {
		e.preventDefault();
		await loginForm.submit();
	}

	function handleFieldBlur(field: 'email' | 'password') {
		loginForm.validateField(field);
	}
</script>

<AuthCard>
	<form onsubmit={handleSubmit} class="space-y-6">
		{#if authError}
			<Alert variant="error" dismissible>
				{authError}
			</Alert>
		{/if}

		<div class="space-y-4">
			<div>
				<Input
					type="email"
					label="メールアドレス"
					placeholder="example@email.com"
					bind:value={formData.email}
					error={errors.email || ''}
					required
					disabled={isSubmitting}
					icon={Mail}
					onblur={() => handleFieldBlur('email')}
				/>
			</div>

			<div>
				<Input
					type="password"
					label="パスワード"
					placeholder="••••••••"
					bind:value={formData.password}
					error={errors.password || ''}
					required
					disabled={isSubmitting}
					icon={Lock}
					onblur={() => handleFieldBlur('password')}
				/>
			</div>
		</div>

		<div class="flex items-center justify-between">
			<RememberMeCheckbox bind:checked={formData.rememberMe} disabled={isSubmitting} />
			<a href="/forgot-password" class="text-sm text-blue-600 hover:text-blue-500">
				パスワードをお忘れですか？
			</a>
		</div>

		<Button
			type="submit"
			variant="primary"
			size="lg"
			class="w-full"
			loading={isSubmitting}
			disabled={isSubmitting}
		>
			ログイン
		</Button>

		<div class="text-center text-sm">
			<span class="text-gray-600">アカウントをお持ちでない方は</span>
			<a href="/signup" class="text-blue-600 hover:text-blue-500 font-medium"> 新規登録 </a>
		</div>
	</form>
</AuthCard>
