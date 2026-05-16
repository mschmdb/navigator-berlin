<script lang="ts">
	import '../app.css';
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { browser } from '$app/environment';
	import SkipLink from '$lib/components/atlas/skip-link.svelte';
	import MetaFooter from '$lib/components/atlas/meta-footer.svelte';
	import { createUiState } from '$lib/state/ui-context.svelte.js';
	import {
		STORAGE_KEY,
		loadBookmarks,
		persistBookmarks
	} from '$lib/state/bookmark-store.js';
	import { mountWebMcpServer, unmountWebMcpServer } from '$lib/webmcp';

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
</script>

<SkipLink />

{@render children()}

<MetaFooter />

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
