import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: [
						'tests/unit/**/*.svelte.test.{js,ts}',
						'tests/integration/**/*.svelte.test.{js,ts}'
					],
					exclude: ['tests/**/server/**'],
					setupFiles: ['./vitest-setup-client.ts', './tests/setup.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: [
						'tests/unit/**/*.{test,spec}.{js,ts}',
						'tests/integration/**/*.{test,spec}.{js,ts}'
					],
					exclude: ['tests/**/*.svelte.test.{js,ts}', 'tests/e2e/**'],
					setupFiles: ['./tests/setup.ts']
				}
			}
		]
	}
});
