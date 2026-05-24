<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref, getLocale } from '$lib/paraglide/runtime';
	import { browser } from '$app/environment';
	import SkipLink from '$lib/components/atlas/skip-link.svelte';
	import MetaFooter from '$lib/components/atlas/meta-footer.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { buildWebSite } from '$lib/seo/index.js';
	import { createUiState } from '$lib/state/ui-context.svelte.js';
	import {
		STORAGE_KEY,
		loadBookmarks,
		persistBookmarks
	} from '$lib/state/bookmark-store.js';
	import { mountWebMcpServer, unmountWebMcpServer } from '$lib/webmcp';
	import { afterNavigate } from '$app/navigation';
	import { trackPageview } from '$lib/utils/plausible.js';

	const ui = createUiState();

	if (browser) {
		const initial = loadBookmarks(localStorage);
		ui.bookmarks = initial.bookmarks;
	}

	$effect(() => {
		if (!browser) return;
		// Feuer-und-vergessen: Mount-Fehler werden nur in der Konsole geloggt,
		// damit eine fehlende native API + fehlendes Polyfill die App nicht
		// brickt.
		mountWebMcpServer().catch((err: unknown) => {
			const msg = err instanceof Error ? err.message : String(err);
			console.warn('[webmcp] mount failed:', msg);
		});
		return () => unmountWebMcpServer();
	});

	$effect(() => {
		if (!browser) return;
		const snapshot = ui.bookmarks;
		queueMicrotask(() => {
			persistBookmarks(localStorage, { schemaVersion: 1, bookmarks: snapshot });
		});
	});

	// Plausible-Pageview pro SvelteKit-Navigation (manual-Mode, kein Auto-Tracking).
	// Pathname-Diff filtert replaceState-URL-Sync auf /explore (Viewport/Layers/
	// Adress-Pin schreiben Query-Params via goto+replaceState, das soll kein Pageview).
	// Initial-Mount: from === null, Bedingung false → Pageview feuert.
	afterNavigate((nav) => {
		if (nav.from && nav.from.url.pathname === nav.to?.url.pathname) return;
		trackPageview();
	});

	$effect(() => {
		if (!browser) return;
		const handler = (e: StorageEvent) => {
			if (e.key !== STORAGE_KEY) return;
			ui.bookmarks = loadBookmarks(localStorage).bookmarks;
		};
		window.addEventListener('storage', handler);
		return () => window.removeEventListener('storage', handler);
	});

	let { children } = $props();

	/**
	 * Story 2.2 AC-3: WebSite-JSON-LD inkl. SearchAction im Root-Layout.
	 * Phase 1 (Memory `project_i18n_phase_1_de_only`): Locale-Tag pro Paraglide-Locale.
	 * Story 2.11 Pivot: wenn Atlas auf `/explore` wandert, `searchPath: '/explore'`.
	 */
	const websiteJsonLd = $derived(
		buildWebSite({
			origin: page.url.origin,
			name: 'navigator.berlin',
			locale: ({ de: 'de-DE', en: 'en-US' } as Record<string, string>)[getLocale()] ?? 'de-DE',
			description: 'Open-Data-Atlas für Berlin. Pro Adresse Lärm, Klima, Grün, Mobilität, Wohnen, Sozialstruktur und Wahlen.'
		})
	);

	const isExplore = $derived(page.url.pathname.startsWith('/explore'));
</script>

<JsonLd data={websiteJsonLd} testid="website-jsonld" />

<SkipLink />

{@render children()}

{#if isExplore}
	<!-- Compact-Bottom-Bar auf /explore. Mobile aus, da Header-Drawer dieselben Links hat. -->
	<div class="hidden md:block">
		<MetaFooter variant="compact" />
	</div>
{:else}
	<MetaFooter variant="full" />
{/if}

<div id="global-aria-live" aria-live="polite" aria-atomic="false" class="sr-only"></div>
<div
	id="global-aria-live-assertive"
	aria-live="assertive"
	aria-atomic="false"
	class="sr-only"
></div>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={(resolve as (path: string) => string)(localizeHref(page.url.pathname, { locale }))}>{locale}</a>
	{/each}
</div>
