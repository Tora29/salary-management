<script lang="ts">
	import Input from '$shared/components/ui/Input.svelte';
	import Button from '$shared/components/ui/Button.svelte';
	import Alert from '$shared/components/ui/Alert.svelte';
	import AuthCard from '$entities/auth/ui/AuthCard.svelte';
	import FormLayout from '$entities/form/ui/FormLayout.svelte';
	import FormSection from '$entities/form/ui/FormSection.svelte';
	import FormFieldGroup from '$entities/form/ui/FormFieldGroup.svelte';
	import FormLink from '$entities/form/ui/FormLink.svelte';
	import FormText from '$entities/form/ui/FormText.svelte';
	import FormCheckbox from '$entities/form/ui/FormCheckbox.svelte';
	import { useSignupForm } from '../composable/useSignupForm.svelte';
	import { User, Mail, Lock, Check } from '@lucide/svelte';

	const signupForm = useSignupForm();
	const { formData, errors, isSubmitting, authError } = signupForm;

	async function handleSubmit(e: Event): Promise<void> {
		e.preventDefault();
		await signupForm.submit();
	}

	function handleFieldBlur(field: 'name' | 'email' | 'password' | 'passwordConfirm'): void {
		signupForm.validateField(field);
	}
</script>

<AuthCard title="給料・資産管理システム" subtitle="新規アカウントを作成">
	<FormLayout onsubmit={handleSubmit}>
		{#if authError}
			<Alert variant="error" dismissible>
				{authError}
			</Alert>
		{/if}

		<FormSection>
			<FormFieldGroup>
				<Input
					type="text"
					label="名前"
					placeholder="山田 太郎"
					bind:value={formData.name}
					error={errors.name || ''}
					required
					disabled={isSubmitting}
					icon={User}
					onblur={() => handleFieldBlur('name')}
				/>
			</FormFieldGroup>

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

			<FormFieldGroup helpText="※ 8文字以上、大文字・小文字・数字を含む">
				<Input
					type="password"
					label="パスワード"
					placeholder="8文字以上の英数字"
					bind:value={formData.password}
					error={errors.password || ''}
					required
					disabled={isSubmitting}
					icon={Lock}
					onblur={() => handleFieldBlur('password')}
				/>
			</FormFieldGroup>

			<FormFieldGroup>
				<Input
					type="password"
					label="パスワード（確認）"
					placeholder="パスワードを再入力"
					bind:value={formData.passwordConfirm}
					error={errors.passwordConfirm || ''}
					required
					disabled={isSubmitting}
					icon={Check}
					onblur={() => handleFieldBlur('passwordConfirm')}
				/>
			</FormFieldGroup>
		</FormSection>

		<FormCheckbox
			id="agree-terms"
			name="agree-terms"
			bind:checked={formData.agreeTerms}
			disabled={isSubmitting}
			error={errors.agreeTerms || ''}
		>
			<FormLink href="/terms" variant="primary">利用規約</FormLink>
			と
			<FormLink href="/privacy" variant="primary">プライバシーポリシー</FormLink>
			に同意します
		</FormCheckbox>

		<Button
			type="submit"
			variant="primary"
			size="lg"
			class="w-full"
			loading={isSubmitting}
			disabled={isSubmitting || !formData.agreeTerms}
		>
			アカウントを作成
		</Button>

		<FormText align="center">
			<FormText variant="muted" align="center">
				既にアカウントをお持ちの方は
				<FormLink href="/login">
					<span class="font-medium">ログイン</span>
				</FormLink>
			</FormText>
		</FormText>
	</FormLayout>
</AuthCard>
