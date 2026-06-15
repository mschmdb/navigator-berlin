<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import FeedDiscoveryLinks from '$lib/components/seo/feed-discovery-links.svelte';
	import {
		CATEGORY_BADGE_CLASSES,
		CATEGORY_LABEL_DE,
		formatDateDe
	} from '$lib/components/updates/category-label.js';
	import { buildBlogPosting, buildBreadcrumbList } from '$lib/seo/index.js';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const entry = $derived(data.entry);
	const bodyHtml = $derived(data.bodyHtml);
	const dateLabel = $derived(formatDateDe(entry.frontmatter.date));
	const categoryLabel = $derived(CATEGORY_LABEL_DE[entry.frontmatter.category]);
	const categoryClass = $derived(CATEGORY_BADGE_CLASSES[entry.frontmatter.category]);

	const pageTitle = $derived(`${entry.frontmatter.title_de} - Berlin in Daten - navigator.berlin`);
	const pageDescription = $derived(entry.frontmatter.summary_de);

	const jsonLd = $derived(buildBlogPosting({ entry, origin: page.url.origin }));

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Updates', path: '/updates' },
				{ name: entry.frontmatter.title_de, path: `/updates/${entry.slug}` }
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
	<nav aria-label="Brotkrumen" class="font-sans text-sm text-ink-muted">
		<a href="/" class="hover:text-accent">Start</a>
		<span aria-hidden="true">›</span>
		<a href="/updates" class="hover:text-accent">Updates</a>
		<span aria-hidden="true">›</span>
		<span class="text-ink">{entry.frontmatter.title_de}</span>
	</nav>

	<header class="flex flex-col gap-3">
		<h1 data-testid="updates-detail-title" class="font-serif text-3xl text-ink">
			{entry.frontmatter.title_de}
		</h1>
		<div class="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
			<time class="font-sans" datetime={entry.frontmatter.date}>{dateLabel}</time>
			<span
				class={`inline-flex items-center border px-2 py-0.5 font-mono text-xs ${categoryClass}`}
				data-testid="category-badge"
			>
				{categoryLabel}
			</span>
		</div>
	</header>

	<section class="prose prose-lg max-w-none font-serif text-ink" data-testid="updates-detail-body">
		{@html bodyHtml}
	</section>

	{#if entry.frontmatter.tags && entry.frontmatter.tags.length > 0}
		<footer class="flex flex-col gap-2 border-t border-rule pt-4" data-testid="updates-detail-tags">
			<p class="font-mono text-xs tracking-wide text-ink-subtle uppercase">Tags</p>
			<ul class="flex flex-wrap gap-2">
				{#each entry.frontmatter.tags as tag (tag)}
					<li
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
			href="/updates"
			class="hover:text-accent-strong text-accent underline underline-offset-2"
			data-testid="updates-back-link"
		>
			← Zurück zur Update-Liste
		</a>
	</p>
</article>
