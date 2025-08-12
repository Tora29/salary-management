<script lang="ts">
	import { Building2, Mail } from '@lucide/svelte';
	import Card from '$shared/components/ui/Card.svelte';
	import Button from '$shared/components/ui/Button.svelte';
	import Alert from '$shared/components/ui/Alert.svelte';
	import Input from '$shared/components/ui/Input.svelte';
	import FormLayout from '$entities/form/ui/FormLayout.svelte';
	import FormSection from '$entities/form/ui/FormSection.svelte';
	import FormFieldGroup from '$entities/form/ui/FormFieldGroup.svelte';
	import { validateEmail } from '$shared/validation/auth';

	let email = $state('');
	let isSubmitting = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	let emailError = $state('');

	function validateEmailField(): boolean {
		if (!email) {
			emailError = 'メールアドレスを入力してください';
			return false;
		}
		if (!validateEmail(email)) {
			emailError = '有効なメールアドレスを入力してください';
			return false;
		}
		emailError = '';
		return true;
	}

	async function handleSubmit(e: Event): Promise<void> {
		e.preventDefault();

		if (!validateEmailField()) {
			return;
		}

		isSubmitting = true;
		successMessage = '';
		errorMessage = '';

		try {
			const response = await fetch('/api/auth/resend-confirmation', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email: email.toLowerCase().trim() })
			});

			const data = await response.json();

			if (!response.ok) {
				errorMessage = data.error || 'メールの送信に失敗しました';
				return;
			}

			successMessage = data.message || '確認メールを送信しました';
			email = '';
		} catch (error) {
			console.error('Resend error:', error);
			errorMessage = 'ネットワークエラーが発生しました';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>確認メール再送信 - 給料・資産管理システム</title>
	<meta name="description" content="確認メールの再送信" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<Building2 class="h-12 w-12 text-blue-600 mx-auto" />
			<h2 class="mt-6 text-3xl font-extrabold text-gray-900">確認メール再送信</h2>
			<p class="mt-2 text-sm text-gray-600">登録時のメールアドレスを入力してください</p>
		</div>

		<Card variant="bordered" padding="lg">
			<FormLayout onsubmit={handleSubmit}>
				{#if successMessage}
					<Alert variant="success" dismissible>
						{successMessage}
					</Alert>
				{/if}

				{#if errorMessage}
					<Alert variant="error" dismissible>
						{errorMessage}
					</Alert>
				{/if}

				<FormSection>
					<FormFieldGroup>
						<Input
							type="email"
							label="メールアドレス"
							placeholder="example@email.com"
							bind:value={email}
							error={emailError}
							required
							disabled={isSubmitting}
							icon={Mail}
							onblur={validateEmailField}
						/>
					</FormFieldGroup>
				</FormSection>

				<Button
					type="submit"
					variant="primary"
					size="lg"
					class="w-full"
					loading={isSubmitting}
					disabled={isSubmitting}
				>
					確認メールを再送信
				</Button>

				<div class="text-center space-y-2">
					<a href="/login" class="text-sm text-blue-600 hover:text-blue-500">
						ログインページへ戻る
					</a>
				</div>
			</FormLayout>
		</Card>
	</div>
</div>
