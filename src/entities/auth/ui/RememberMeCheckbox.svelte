<script lang="ts">
	let {
		checked = $bindable(false),
		disabled = false
	}: {
		checked?: boolean;
		disabled?: boolean;
	} = $props();
</script>

<div class="flex items-center">
	<input
		id="remember-me"
		name="remember-me"
		type="checkbox"
		bind:checked
		{disabled}
		class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
	/>
	<label for="remember-me" class="ml-2 block text-sm text-gray-900">ログイン状態を保持する</label>
</div>
