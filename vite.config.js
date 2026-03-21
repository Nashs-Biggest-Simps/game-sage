import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import ruePlugin from 'rue-lang/src/vite-plugin.js';

export default defineConfig({
	plugins: [ruePlugin(), sveltekit()]
});
