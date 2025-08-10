import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: true
	},
	kit: {
		adapter: adapter(),
		alias: {
			$entities: 'src/entities',
			$features: 'src/features',
			$widgets: 'src/widgets',
			$shared: 'src/shared',
			$lib: 'src/lib'
		}
	}
};

export default config;
