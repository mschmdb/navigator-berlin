<script lang="ts">
	import { page } from '$app/state';
	import StoryEntryItem from '$lib/components/stories/story-entry.svelte';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { buildStoriesIndex, STORIES_IMAGE_PATH } from '$lib/seo/jsonld-story.js';
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
	const ogImage = $derived(`${primaryOrigin}${STORIES_IMAGE_PATH}`);

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
	ogImageAlt={m.stories_og_composition_alt()}
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

	{#if data.entries.length > 0}
		<ul
			aria-label={m.stories_index_list_aria_label()}
			class="flex flex-col gap-4"
			data-testid="stories-list"
		>
			{#each data.entries as entry (entry.slug)}
				<StoryEntryItem {entry} preview={data.preview} />
			{/each}
		</ul>
	{:else}
		<p class="text-base text-ink-muted" data-testid="stories-empty">{m.stories_index_empty()}</p>
	{/if}
</div>
