<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { formatUpdateDate } from '$lib/components/updates/category-label.js';
	import { localizeStory } from '$lib/content/stories/localize-story.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { buildStoriesIndex } from '$lib/seo/jsonld-story.js';
	import { canonicalOrigin, localizedPathname } from '$lib/seo/canonical.js';
	import { buildPageTitle } from '$lib/seo/page-title.js';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const locale = $derived(getLocale());
	const origin = $derived(page.url.origin);
	const primaryOrigin = $derived(canonicalOrigin(origin));
	// Logischer Pfad: auf der Stories-Subdomain ist `page.url.pathname` die Wurzel `/`,
	// die Canonical-URL gehört auf `/stories` (siehe `storiesReroute` in `$lib/app-mode.ts`).
	const pathname = '/stories';
	const ogImage = $derived(`${primaryOrigin}/og/page/home.png`);

	const items = $derived(
		data.entries.map((entry) => ({
			entry,
			localized: localizeStory(entry, locale),
			href: localizedHref(`/stories/${entry.slug}`),
			dateLabel: formatUpdateDate(entry.frontmatter.date, locale)
		}))
	);

	const blogJsonLd = $derived(
		buildStoriesIndex({
			entries: data.entries,
			origin: primaryOrigin,
			locale,
			name: m.stories_index_h1(),
			description: m.stories_jsonld_blog_description()
		})
	);
	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: primaryOrigin,
			items: [
				{ name: m.stories_breadcrumb_start(), path: localizedPathname('/', locale) },
				{ name: m.stories_breadcrumb_stories(), path: localizedPathname('/stories', locale) }
			]
		})
	);
</script>

<SeoHead
	title={buildPageTitle(m.stories_index_page_title())}
	description={m.stories_index_page_description()}
	{pathname}
	{origin}
	{ogImage}
	ogImageAlt={m.stories_index_og_alt()}
/>
<JsonLd data={blogJsonLd} testid="stories-index-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="stories-index-breadcrumb-jsonld" />

<div
	data-testid="stories-index-page"
	class="text-measure mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8"
>
	<header class="flex flex-col gap-2">
		<h1 data-testid="stories-page-title" class="text-3xl font-bold text-ink">
			{m.stories_index_h1()}
		</h1>
		<p class="text-lg leading-body text-ink-muted">{m.stories_index_lead()}</p>
	</header>

	{#if items.length > 0}
		<ul
			aria-label={m.stories_index_list_aria_label()}
			class="flex flex-col gap-4"
			data-testid="stories-list"
		>
			{#each items as item (item.entry.slug)}
				<li
					class="flex flex-col gap-3 border-l-2 border-rule bg-bg px-4 py-4"
					data-testid="stories-entry"
					data-slug={item.entry.slug}
				>
					<time class="font-sans text-sm text-ink-muted" datetime={item.entry.frontmatter.date}>
						{item.dateLabel}
					</time>
					<h2
						class="text-2xl font-bold text-ink"
						lang={item.localized.titleIsDeFallback ? 'de' : undefined}
					>
						<a
							href={item.href}
							class="inline-flex min-h-6 items-center hover:text-accent focus-visible:text-accent"
							data-testid="stories-entry-link"
						>
							{item.localized.title}
						</a>
					</h2>
					<p
						class="text-base leading-body text-ink-muted"
						lang={item.localized.summaryIsDeFallback ? 'de' : undefined}
					>
						{item.localized.summary}
					</p>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-base text-ink-muted" data-testid="stories-empty">{m.stories_index_empty()}</p>
	{/if}
</div>
