<script lang="ts">
	import type { User } from '../model/types';
	import UserAvatar from './UserAvatar.svelte';

	const {
		user,
		showAvatar = true,
		class: className = ''
	}: {
		user: User;
		showAvatar?: boolean;
		class?: string;
	} = $props();

	const displayName = $derived(user.profile?.name || user.email.split('@')[0]);
</script>

<div class={`flex items-center space-x-3 ${className}`}>
	{#if showAvatar}
		<UserAvatar profile={user.profile || null} size="sm" />
	{/if}
	<div class="flex flex-col">
		<span class="text-sm font-medium text-gray-900">{displayName}</span>
		<span class="text-xs text-gray-500">{user.email}</span>
	</div>
</div>
