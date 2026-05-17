import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { FontaineTransform } from 'fontaine';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' }),
		FontaineTransform.vite({
			fallbacks: ['system-ui', 'Georgia', 'ui-monospace'],
			resolvePath: (id) => new URL(`./static${id}`, import.meta.url)
		})
	],
	resolve: {
		dedupe: ['svelte', 'svelte/internal']
	},
	ssr: {
		// Natives (.node + wasm) niemals bündeln, sonst Rollup PARSE_ERROR auf Binary-Magic-Bytes.
		// Liste enthält Top-Level UND alle platform-spezifischen Sub-Pakete (npm-optionalDependencies).
		external: [
			'@resvg/resvg-js',
			'@resvg/resvg-js-linux-x64-gnu',
			'@resvg/resvg-js-linux-x64-musl',
			'@resvg/resvg-js-linux-arm64-gnu',
			'@resvg/resvg-js-linux-arm64-musl',
			'@resvg/resvg-js-darwin-x64',
			'@resvg/resvg-js-darwin-arm64',
			'wawoff2',
			'fontnik',
			'better-sqlite3'
		],
		noExternal: ['satori']
	},
	optimizeDeps: {
		exclude: ['bits-ui'],
		include: ['layerchart']
	},
	build: {
		commonjsOptions: {
			ignoreDynamicRequires: true
		},
		rollupOptions: {
			output: {
				manualChunks(id: string): string | undefined {
					if (id.includes('node_modules/maplibre-gl')) return 'maplibre';
					if (
						id.includes('node_modules/layerchart') ||
						id.includes('node_modules/d3-scale') ||
						id.includes('node_modules/d3-interpolate') ||
						id.includes('node_modules/d3-array')
					)
						return 'layerchart';
					if (id.includes('node_modules/@turf/') || id.includes('node_modules/rbush'))
						return 'turf';
					return undefined;
				}
			}
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: [
						'src/**/*.{test,spec}.{js,ts}',
						'scripts/**/*.{test,spec}.{js,ts}',
						'tests/**/*.{test,spec}.{js,ts}'
					],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
