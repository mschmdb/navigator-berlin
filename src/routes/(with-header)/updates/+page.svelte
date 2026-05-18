<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import FeedDiscoveryLinks from '$lib/components/seo/feed-discovery-links.svelte';
	import UpdatesFilter from '$lib/components/updates/updates-filter.svelte';
	import UpdatesEntryCard from '$lib/components/updates/updates-entry-card.svelte';
	import {
		parseCategoryFilter,
		serializeCategoryFilter,
		applyCategoryFilter
	} from '$lib/content/updates/parse-filter.js';
	import { buildBlogIndex, buildBreadcrumbList } from '$lib/seo/index.js';
	import type { UpdateCategory } from '$lib/content/updates/types.js';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const entries = $derived(data.entries);

	// URL-State-Sync für Filter
	const urlFilter = $derived(parseCategoryFilter(page.url.searchParams.get('cat')));
	let filterValue = $state<UpdateCategory[]>([]);

	$effect(() => {
		// pull URL → state bei Navigation
		const fromUrl = [...urlFilter].sort();
		const fromState = [...filterValue].sort();
		if (fromUrl.join(',') !== fromState.join(',')) {
			filterValue = fromUrl;
		}
	});

	$effect(() => {
		// push state → URL (replaceState, keepFocus, noScroll)
		const next = serializeCategoryFilter(new Set(filterValue));
		const current = page.url.searchParams.get('cat') ?? '';
		if (next === current) return;
		const url = new URL(page.url);
		if (next) url.searchParams.set('cat', next);
		else url.searchParams.delete('cat');
		void goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	});

	const filteredEntries = $derived(
		applyCategoryFilter(entries, new Set(filterValue))
	);

	const pageTitle = 'Updates - Berlin in Daten - navigator.berlin';
	const pageDescription =
		'Daten-Refreshes, Feature-Releases und Methodik-Änderungen. Mit RSS, Atom und JSON-Feed.';

	const blogJsonLd = $derived(
		buildBlogIndex({ entries, origin: page.url.origin })
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Updates', path: '/updates' }
			]
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/page/updates.png`}
	ogImageAlt="navigator.berlin Updates"
/>
<FeedDiscoveryLinks origin={page.url.origin} />
<JsonLd data={blogJsonLd} testid="updates-index-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="updates-index-breadcrumb-jsonld" />

<article
	data-testid="updates-index-page"
	class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8"
>
	<header class="flex flex-col gap-2">
		<h1 data-testid="updates-page-title" class="font-serif text-3xl text-ink">Updates</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			Daten-Refreshes, Feature-Releases und Methodik-Änderungen. Abonnieren via
			<a
				href="/updates/rss.xml"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>RSS</a
			>,
			<a
				href="/updates/atom.xml"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>Atom</a
			>
			oder
			<a
				href="/updates/feed.json"
				class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>JSON Feed</a
			>.
		</p>
	</header>

	<UpdatesFilter bind:value={filterValue} />

	<p
		class="font-mono text-xs text-ink-subtle"
		aria-live="polite"
		data-testid="updates-filter-feedback"
	>
		{#if filterValue.length === 0}
			Alle Kategorien aktiv. {filteredEntries.length} Einträge.
		{:else}
			{filteredEntries.length}
			{filteredEntries.length === 1 ? 'Eintrag' : 'Einträge'} gefiltert.
		{/if}
	</p>

	<section
		aria-label="Update-Einträge"
		class="flex flex-col gap-4"
		data-testid="updates-list"
	>
		{#each filteredEntries as entry (entry.slug)}
			<UpdatesEntryCard {entry} />
		{:else}
			<p class="font-serif text-base text-ink-muted">
				Keine Updates in dieser Auswahl. Filter zurücksetzen oder andere Kategorie wählen.
			</p>
		{/each}
	</section>
</article>
