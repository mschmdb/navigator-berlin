<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import FeedDiscoveryLinks from '$lib/components/seo/feed-discovery-links.svelte';
	import {
		CATEGORY_BADGE_CLASSES,
		categoryLabel,
		formatUpdateDate
	} from '$lib/components/updates/category-label.js';
	import { localizeUpdateEntry } from '$lib/content/updates/localize-update-entry.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { buildBlogPosting, buildBreadcrumbList } from '$lib/seo/index.js';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const entry = $derived(data.entry);
	const bodyHtml = $derived(data.bodyHtml);
	const locale = $derived(getLocale());
	const localized = $derived(localizeUpdateEntry(entry, locale));
	const dateLabel = $derived(formatUpdateDate(entry.frontmatter.date, locale));
	const badgeLabel = $derived(categoryLabel(entry.frontmatter.category, locale));
	const categoryClass = $derived(CATEGORY_BADGE_CLASSES[entry.frontmatter.category]);
	const titleLang = $derived(localized.titleIsDeFallback ? 'de' : undefined);
	// Tag-Slugs sind deutsch, auch auf `/en`.
	const tagLang = $derived(locale === 'de' ? undefined : 'de');
	const bodyLang = $derived(data.bodyIsDeFallback ? 'de' : undefined);

	const pageTitle = $derived(m.updates_detail_page_title({ title: localized.title }));
	const pageDescription = $derived(localized.summary);

	const jsonLd = $derived(
		buildBlogPosting({
			entry,
			origin: page.url.origin,
			locale,
			bodyIsDeFallback: data.bodyIsDeFallback
		})
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: localizedHref('/') },
				{ name: 'Updates', path: localizedHref('/updates') },
				{ name: localized.title, path: localizedHref(`/updates/${entry.slug}`) }
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

<svelte:head>
	<meta property="og:type" content="article" />
	<meta property="article:published_time" content={entry.frontmatter.date} />
	<meta property="article:section" content={entry.frontmatter.category} />
	<meta property="article:author" content="Matze Schmidbauer" />
</svelte:head>
<JsonLd data={jsonLd} testid="updates-detail-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="updates-detail-breadcrumb-jsonld" />

<article data-testid="updates-detail-page" class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
	<nav aria-label={m.breadcrumb_aria_label()} class="font-sans text-sm text-ink-muted">
		<a href={localizedHref('/')} class="hover:text-accent">{m.updates_detail_breadcrumb_start()}</a>
		<span aria-hidden="true">›</span>
		<a href={localizedHref('/updates')} class="hover:text-accent">Updates</a>
		<span aria-hidden="true">›</span>
		<span class="text-ink" lang={titleLang}>{localized.title}</span>
	</nav>

	<header class="flex flex-col gap-3">
		<h1 data-testid="updates-detail-title" class="font-serif text-3xl text-ink" lang={titleLang}>
			{localized.title}
		</h1>
		<div class="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
			<time class="font-sans" datetime={entry.frontmatter.date}>{dateLabel}</time>
			<span
				class={`inline-flex items-center border px-2 py-0.5 font-mono text-xs ${categoryClass}`}
				data-testid="category-badge"
			>
				{badgeLabel}
			</span>
		</div>
	</header>

	<section
		class="prose prose-lg max-w-none font-serif text-ink"
		data-testid="updates-detail-body"
		lang={bodyLang}
	>
		{@html bodyHtml}
	</section>

	{#if entry.frontmatter.tags && entry.frontmatter.tags.length > 0}
		<footer class="flex flex-col gap-2 border-t border-rule pt-4" data-testid="updates-detail-tags">
			<p class="font-mono text-xs tracking-wide text-ink-subtle uppercase">
				{m.updates_detail_tags_heading()}
			</p>
			<ul class="flex flex-wrap gap-2">
				{#each entry.frontmatter.tags as tag (tag)}
					<li
						lang={tagLang}
						class="inline-flex items-center border border-rule bg-bg-elevated px-2 py-0.5 font-mono text-xs text-ink-muted"
					>
						{tag}
					</li>
				{/each}
			</ul>
		</footer>
	{/if}

	<p class="font-mono text-xs">
		<a
			href={localizedHref('/updates')}
			class="hover:text-accent-strong text-accent underline underline-offset-2"
			data-testid="updates-back-link"
		>
			{m.updates_detail_back_link()}
		</a>
	</p>
</article>
