<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { createSupabaseBrowserClient } from '$shared/utils/supabase';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	const { children, data } = $props<{ children: Snippet; data: LayoutData }>();

	onMount(() => {
		if (!browser) {
			return;
		}

		const supabase = createSupabaseBrowserClient();

		// Supabaseの認証状態変更をリッスン
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, _session) => {
			if (_session?.expires_at !== data.session?.expires_at) {
				// セッションが変更されたらページを再検証
				invalidate('supabase:auth');
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});
</script>

{@render children()}
