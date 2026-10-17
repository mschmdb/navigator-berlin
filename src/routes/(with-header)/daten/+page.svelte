<script lang="ts">
	import { isRedundantDescription } from '$lib/utils/redundant-description.js';
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import Breadcrumb from '$lib/components/atlas/breadcrumb.svelte';
	import { groupLayersForOverview } from '$lib/data/layer-overview.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedPathname } from '$lib/seo/canonical.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { buildPageTitle } from '$lib/seo/page-title.js';
	import { DEFAULT_OG_IMAGE_PATH } from '$lib/utils/og-image-url.js';
	import type { PageData } from './$types';

	interface Props {
		readonly data: PageData;
	}

	const { data }: Props = $props();

	const locale = $derived(getLocale());
	const groups = $derived(groupLayersForOverview(data.layers, locale));
	const layerCount = $derived(groups.reduce((sum, g) => sum + g.layers.length, 0));

	const breadcrumbItems = $derived([
		{ name: 'Berlin', path: '/' },
		{ name: m.overview_daten_breadcrumb(), path: '/daten' }
	]);
	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: breadcrumbItems.map((item) => ({
				...item,
				path: localizedPathname(item.path, locale)
			}))
		})
	);
</script>

<SeoHead
	title={buildPageTitle(m.overview_daten_meta_title({ count: layerCount }))}
	description={m.overview_daten_meta_description({ count: layerCount })}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}${DEFAULT_OG_IMAGE_PATH}`}
	ogImageAlt={m.overview_og_image_alt()}
/>
<JsonLd data={breadcrumbJsonLd} testid="daten-breadcrumb-jsonld" />

<div class="mx-auto max-w-3xl px-4 pt-6">
	<Breadcrumb items={breadcrumbItems} />
</div>

<article data-testid="daten-overview" class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
	<header class="flex flex-col gap-3">
		<h1 class="text-3xl font-bold text-ink">{m.overview_daten_h1()}</h1>
		<p class="text-lg leading-body text-ink-muted">
			{m.overview_daten_intro({ count: layerCount })}
		</p>
		<ul class="flex flex-wrap gap-x-6 gap-y-1 font-sans text-base">
			<li>
				<a
					href={localizedHref('/explore')}
					class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>
					{m.overview_daten_atlas_link()}
				</a>
			</li>
			<li>
				<a
					href={localizedHref('/lizenzen')}
					class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>
					{m.overview_daten_lizenzen_link()}
				</a>
			</li>
		</ul>
	</header>

	{#each groups as group, index (group.bundle)}
		<section
			aria-labelledby={`layer-group-${index}-h`}
			class="flex flex-col gap-3 border-t border-rule pt-6"
		>
			<h2 id={`layer-group-${index}-h`} class="text-2xl font-bold text-ink">
				{group.label}
			</h2>
			<ul class="flex flex-col font-sans text-base">
				{#each group.layers as layer (layer.slug)}
					<li
						data-testid="layer-overview-item"
						class="flex flex-col gap-1 border-b border-rule/40 py-3"
					>
						<a
							href={localizedHref(`/layer/${layer.slug}`)}
							class="w-fit text-accent underline underline-offset-2 hover:text-accent-strong"
						>
							{layer.name}
						</a>
						{#if layer.description && !isRedundantDescription(layer.name, layer.description)}
							<p class="text-sm text-ink-muted">{layer.description}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</article>
