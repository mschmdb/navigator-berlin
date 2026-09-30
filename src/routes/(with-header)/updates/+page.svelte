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
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { UpdateCategory } from '$lib/content/updates/types.js';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const entries = $derived(data.entries);
	// Feeds bleiben DE (kein EN-Feed): auf `/en/updates` kennzeichnet hreflang das Ziel.
	const feedLang = $derived(getLocale() === 'de' ? undefined : 'de');

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

	const filteredEntries = $derived(applyCategoryFilter(entries, new Set(filterValue)));

	const pageTitle = $derived(m.updates_index_page_title());
	const pageDescription = $derived(m.updates_index_page_description());

	const blogJsonLd = $derived(
		buildBlogIndex({
			entries,
			origin: page.url.origin,
			locale: getLocale(),
			description: m.updates_jsonld_blog_description()
		})
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: localizedHref('/') },
				{ name: 'Updates', path: localizedHref('/updates') }
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

<article data-testid="updates-index-page" class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
	<header class="flex flex-col gap-2">
		<h1 data-testid="updates-page-title" class="font-serif text-3xl text-ink">Updates</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			{m.updates_index_lead_before()}
			<a
				href="/updates/rss.xml"
				hreflang={feedLang}
				class="hover:text-accent-strong text-accent underline underline-offset-2">RSS</a
			>,
			<a
				href="/updates/atom.xml"
				hreflang={feedLang}
				class="hover:text-accent-strong text-accent underline underline-offset-2">Atom</a
			>
			{m.updates_index_lead_or()}
			<a
				href="/updates/feed.json"
				hreflang={feedLang}
				class="hover:text-accent-strong text-accent underline underline-offset-2">JSON Feed</a
			>.
		</p>
	</header>

	<UpdatesFilter bind:value={filterValue} />

	<p
		class="font-mono text-xs text-ink-subtle"
		aria-live="polite"
		data-testid="updates-filter-feedback"
	>
		{#if filterValue.length === 0 && filteredEntries.length === 1}
			{m.updates_index_filter_feedback_all_one()}
		{:else if filterValue.length === 0}
			{m.updates_index_filter_feedback_all({ count: filteredEntries.length })}
		{:else if filteredEntries.length === 1}
			{m.updates_index_filter_feedback_filtered_one()}
		{:else}
			{m.updates_index_filter_feedback_filtered_many({ count: filteredEntries.length })}
		{/if}
	</p>

	<section
		aria-label={m.updates_index_list_aria_label()}
		class="flex flex-col gap-4"
		data-testid="updates-list"
	>
		{#each filteredEntries as entry (entry.slug)}
			<UpdatesEntryCard {entry} />
		{:else}
			<p class="font-serif text-base text-ink-muted">
				{m.updates_index_empty()}
			</p>
		{/each}
	</section>
</article>
