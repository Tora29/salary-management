<script lang="ts">
	import type { UserProfile } from '../model/types';
	import { User } from '@lucide/svelte';

	const {
		profile,
		size = 'md',
		class: className = ''
	}: {
		profile?: UserProfile | null;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	} = $props();

	const sizeClasses = {
		sm: 'h-8 w-8 text-xs',
		md: 'h-10 w-10 text-sm',
		lg: 'h-16 w-16 text-lg'
	};

	const avatarClasses = `rounded-full bg-gray-200 flex items-center justify-center ${sizeClasses[size]} ${className}`;
</script>

{#if profile?.avatarUrl}
	<img
		src={profile.avatarUrl}
		alt={profile.name || 'User avatar'}
		class={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
	/>
{:else}
	<div class={avatarClasses}>
		{#if profile?.name}
			<span class="font-medium text-gray-600">
				{profile.name.charAt(0).toUpperCase()}
			</span>
		{:else}
			<User class="text-gray-500" />
		{/if}
	</div>
{/if}
