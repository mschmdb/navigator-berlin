<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import PunktLinieKiezAuswahl from '$lib/components/stories/punkt-linie-kiez-auswahl.svelte';
	import Handbuch from '$lib/components/stories/wahl-handbuch/handbuch.svelte';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { formatUpdateDate } from '$lib/components/updates/category-label.js';
	import { localizeStory } from '$lib/content/stories/localize-story.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { buildStoryPosting, storyImagePath } from '$lib/seo/jsonld-story.js';
	import { canonicalOrigin, localizedPathname } from '$lib/seo/canonical.js';
	import { buildPageTitle } from '$lib/seo/page-title.js';
	import {
		DEFAULT_URL_STATE,
		parseUrlState,
		serializeUrlState,
		type ZeitState
	} from '$lib/stories/wahl-quadrate/url-state';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	// Die Seite ist prerendert. Den Query-Parameter liest erst der Client nach dem Mount.
	let initialBezirk = $state<string | undefined>(undefined);
	let zeit = $state<ZeitState>(DEFAULT_URL_STATE.zeit);
	onMount(() => {
		initialBezirk = new URLSearchParams(window.location.search).get('bezirk') ?? undefined;
		zeit = parseUrlState(new URL(window.location.href)).zeit;
	});

	/** Kapitel 5 im Handbuch: Bezirk und Wahl teilbar in der URL, andere Parameter bleiben. */
	function rememberZeit(next: ZeitState): void {
		const url = new URL(window.location.href);
		const state = { ...parseUrlState(url), zeit: next };
		url.search = serializeUrlState(state, url.searchParams).search;
		replaceState(url, page.state);
	}

	/** Hält die Wahl in der URL teilbar, ohne den Verlauf zu füllen. */
	function rememberBezirk(slug: string): void {
		const url = new URL(window.location.href);
		url.searchParams.set('bezirk', slug);
		replaceState(url, page.state);
	}

	const entry = $derived(data.entry);
	const locale = $derived(getLocale());
	const localized = $derived(localizeStory(entry, locale));
	const dateLabel = $derived(formatUpdateDate(entry.frontmatter.date, locale));
	const titleLang = $derived(localized.titleIsDeFallback ? 'de' : undefined);
	const bodyLang = $derived(data.bodyIsDeFallback ? 'de' : undefined);
	const primaryOrigin = $derived(canonicalOrigin(page.url.origin));
	const imagePath = $derived(storyImagePath(entry, getLocale()));
	const hasComposition = $derived(imagePath !== '/og/page/home.png');
	const ogImage = $derived(`${primaryOrigin}${imagePath}`);
	const handbuch = $derived(
		entry.frontmatter.visual === 'berlin-in-quadraten' && data.sections && data.wahlDaten
			? { sections: data.sections, daten: data.wahlDaten }
			: null
	);

	const jsonLd = $derived(
		buildStoryPosting({
			entry,
			image: ogImage,
			origin: primaryOrigin,
			locale,
			bodyIsDeFallback: data.bodyIsDeFallback
		})
	);
	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: primaryOrigin,
			items: [
				{ name: m.stories_breadcrumb_start(), path: localizedPathname('/', locale) },
				{ name: m.stories_breadcrumb_stories(), path: localizedPathname('/stories', locale) },
				{ name: localized.title, path: localizedPathname(`/stories/${entry.slug}`, locale) }
			]
		})
	);
</script>

<SeoHead
	title={buildPageTitle(localized.title)}
	description={localized.summary}
	pathname={page.url.pathname}
	origin={page.url.origin}
	{ogImage}
	ogImageAlt={handbuch
		? m.bq_hb_og_alt()
		: hasComposition
			? m.stories_og_composition_alt()
			: m.stories_index_og_alt()}
	ogType="article"
	article={{ publishedTime: entry.frontmatter.date, section: 'Berlin Data Stories' }}
/>
<JsonLd data={jsonLd} testid="stories-detail-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="stories-detail-breadcrumb-jsonld" />

<article
	data-testid="stories-detail-page"
	class="mx-auto flex flex-col gap-6 px-4 py-8 {handbuch ? 'max-w-[1240px]' : 'max-w-3xl'}"
>
	<nav aria-label={m.breadcrumb_aria_label()} class="font-sans text-sm text-ink-muted">
		<a href={localizedHref('/')} class="inline-block min-h-6 hover:text-accent">
			{m.stories_breadcrumb_start()}
		</a>
		<span aria-hidden="true">›</span>
		<a href={localizedHref('/stories')} class="inline-block min-h-6 hover:text-accent">
			{m.stories_breadcrumb_stories()}
		</a>
		<span aria-hidden="true">›</span>
		<span class="text-ink" lang={titleLang}>{localized.title}</span>
	</nav>

	{#if handbuch}
		<Handbuch
			title={localized.title}
			date={entry.frontmatter.date}
			{dateLabel}
			sections={handbuch.sections}
			daten={handbuch.daten}
			{zeit}
			onzeit={rememberZeit}
			{titleLang}
			{bodyLang}
		/>
	{:else}
		<header class="flex flex-col gap-3">
			<h1 data-testid="stories-detail-title" class="text-3xl font-bold text-ink" lang={titleLang}>
				{localized.title}
			</h1>
			<div class="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
				<time class="font-sans" datetime={entry.frontmatter.date}>{dateLabel}</time>
				{#if entry.frontmatter.series}
					<span data-testid="stories-detail-series">
						{m.stories_detail_series_label()}: {entry.frontmatter.series}
					</span>
				{/if}
			</div>
		</header>

		{#if data.bodyHtmlBefore}
			<section
				class="prose prose-lg max-w-none text-ink [&_a]:py-px"
				data-testid="stories-detail-intro"
				lang={bodyLang}
			>
				{@html data.bodyHtmlBefore}
			</section>
		{/if}

		{#if entry.frontmatter.visual === 'punkt-linie-kiez-bezirke' && data.bezirkeDaten}
			<PunktLinieKiezAuswahl
				initialSlug={initialBezirk}
				onselect={rememberBezirk}
				bezirke={data.bezirkeDaten.bezirke}
				sources={data.bezirkeDaten.sources}
			/>
		{/if}

		<section
			class="prose prose-lg max-w-none text-ink [&_a]:py-px"
			data-testid="stories-detail-body"
			lang={bodyLang}
		>
			{@html data.bodyHtml}
		</section>
	{/if}

	<p class="text-sm">
		<a
			href={localizedHref('/stories')}
			class="inline-flex min-h-6 items-center text-accent underline underline-offset-2 hover:text-accent-strong"
			data-testid="stories-back-link"
		>
			{m.stories_detail_back_link()}
		</a>
	</p>
</article>
