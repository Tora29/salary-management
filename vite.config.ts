import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e/**/*', '**/e2e/**']
	}
});
