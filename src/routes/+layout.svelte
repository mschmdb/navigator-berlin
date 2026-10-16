<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { locales } from '$lib/paraglide/runtime';
	import { browser } from '$app/environment';
	import SkipLink from '$lib/components/atlas/skip-link.svelte';
	import MetaFooter from '$lib/components/atlas/meta-footer.svelte';
	import LangSwitcher from '$lib/components/atlas/lang-switcher.svelte';
	import { basePathname } from '$lib/i18n/base-path.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { createUiState } from '$lib/state/ui-context.svelte.js';
	import { STORAGE_KEY, loadBookmarks, persistBookmarks } from '$lib/state/bookmark-store.js';
	import { mountWebMcpServer, unmountWebMcpServer } from '$lib/webmcp';
	import { afterNavigate } from '$app/navigation';
	import { trackPageview } from '$lib/utils/plausible.js';
	import { pageviewPathFor } from '$lib/app-mode';

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
		// Hitze-Subdomain: `/` reroutet auf `/hitze`, die URL bleibt aber `/`. Host-basiert
		// erkennen (zuverlässiger als route.id nach Reroute) und `/hitze` an Plausible melden,
		// sonst vermischt sich der Subdomain-Traffic mit der Homepage.
		const toUrl = nav.to?.url;
		trackPageview(toUrl ? pageviewPathFor(toUrl) : undefined);
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

	// Code-review fix (i18n Block A): `page.url.pathname` trägt auf `/en/...`
	// den Locale-Präfix, ein nackter `startsWith` hätte `/en/explore` in den
	// falschen Layout-Zweig gesteckt. `basePathname()` normalisiert zuerst.
	const isExplore = $derived(basePathname(page.url).startsWith('/explore'));
</script>

{#snippet langSwitcher()}
	<!-- landmark=false: die Header/Drawer-Instanz (with-header)/+layout.svelte
	     ist bei jeder Viewport-Breite die einzige SICHTBARE zweite Instanz
	     (CSS display:none schließt die jeweils andere aus), aber der Footer
	     ist IMMER zusätzlich sichtbar -- ohne diese Prop entstünden zwei
	     gleichnamige "Sprache"-<nav>-Landmarks (WCAG code review). -->
	<LangSwitcher currentPath={page.url.pathname} landmark={false} />
{/snippet}

<SkipLink />

{@render children()}

{#if isExplore}
	<!-- Compact-Bottom-Bar auf /explore. Mobile aus, da Header-Drawer dieselben Links hat. -->
	<div class="hidden md:block">
		<MetaFooter variant="compact" {langSwitcher} />
	</div>
{:else}
	<MetaFooter variant="full" {langSwitcher} />
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
		<a href={localizedHref(page.url.pathname, locale)}>{locale}</a>
	{/each}
</div>
