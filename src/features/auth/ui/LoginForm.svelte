<script lang="ts">
	import Input from '$shared/components/ui/Input.svelte';
	import Button from '$shared/components/ui/Button.svelte';
	import Alert from '$shared/components/ui/Alert.svelte';
	import AuthCard from '$entities/auth/ui/AuthCard.svelte';
	import RememberMeCheckbox from '$entities/auth/ui/RememberMeCheckbox.svelte';
	import FormLayout from '$entities/form/ui/FormLayout.svelte';
	import FormSection from '$entities/form/ui/FormSection.svelte';
	import FormFieldGroup from '$entities/form/ui/FormFieldGroup.svelte';
	import FormLink from '$entities/form/ui/FormLink.svelte';
	import FormText from '$entities/form/ui/FormText.svelte';
	import { useLoginForm } from '../composable/useLoginForm.svelte';
	import { Mail, Lock } from '@lucide/svelte';

	const loginForm = useLoginForm();
	const { formData, errors, isSubmitting, authError } = loginForm;

	async function handleSubmit(e: Event): Promise<void> {
		e.preventDefault();
		await loginForm.submit();
	}

	function handleFieldBlur(field: 'email' | 'password'): void {
		loginForm.validateField(field);
	}
</script>

<AuthCard title="給料・資産管理システム" subtitle="アカウントにログインしてください">
	<FormLayout onsubmit={handleSubmit}>
		{#if authError}
			<Alert variant="error" dismissible>
				{authError}
			</Alert>
		{/if}

		<FormSection>
			<FormFieldGroup>
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
			</FormFieldGroup>

			<FormFieldGroup>
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
			</FormFieldGroup>
		</FormSection>

		<div class="flex flex-col gap-3">
			<RememberMeCheckbox bind:checked={formData.rememberMe} disabled={isSubmitting} />
			<div class="flex items-center justify-center gap-4 text-sm">
				<FormLink href="/forgot-password" size="sm">パスワードをお忘れですか？</FormLink>
				<span class="text-gray-300 dark:text-gray-600">|</span>
				<FormLink href="/auth/resend-confirmation" size="sm">メールが届かない場合</FormLink>
			</div>
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

		<FormText align="center">
			<FormText variant="muted" align="center">
				アカウントをお持ちでない方は
				<FormLink href="/signup">
					<span class="font-medium">新規登録</span>
				</FormLink>
			</FormText>
		</FormText>
	</FormLayout>
</AuthCard>
