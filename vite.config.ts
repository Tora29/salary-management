import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e/**/*', '**/e2e/**']
	}
});
