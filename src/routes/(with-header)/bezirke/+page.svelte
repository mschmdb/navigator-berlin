<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import Breadcrumb from '$lib/components/atlas/breadcrumb.svelte';
	import { formatCount } from '$lib/i18n/format.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedPathname } from '$lib/seo/canonical.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { buildPageTitle } from '$lib/seo/page-title.js';
	import { formatStichtag } from '$lib/seo/profile-meta.js';
	import { DEFAULT_OG_IMAGE_PATH } from '$lib/utils/og-image-url.js';
	import type { PageData } from './$types';

	interface Props {
		readonly data: PageData;
	}

	const { data }: Props = $props();

	const locale = $derived(getLocale());
	const bezirkCount = $derived(data.bezirke.length);
	const stand = $derived(formatStichtag(data.einwohnerStichtag, locale));

	const breadcrumbItems = $derived([
		{ name: 'Berlin', path: '/' },
		{ name: m.overview_bezirke_breadcrumb(), path: '/bezirke' }
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
	title={buildPageTitle(m.overview_bezirke_meta_title({ count: bezirkCount }))}
	description={m.overview_bezirke_meta_description({ count: bezirkCount })}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}${DEFAULT_OG_IMAGE_PATH}`}
	ogImageAlt={m.overview_og_image_alt()}
/>
<JsonLd data={breadcrumbJsonLd} testid="bezirke-breadcrumb-jsonld" />

<div class="mx-auto max-w-3xl px-4 pt-6">
	<Breadcrumb items={breadcrumbItems} />
</div>

<article data-testid="bezirke-overview" class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
	<header class="flex flex-col gap-3">
		<h1 class="font-serif text-3xl text-ink">{m.overview_bezirke_h1()}</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			{m.overview_bezirke_intro({ count: bezirkCount })}
		</p>
		{#if stand}
			<p class="font-sans text-sm text-ink-muted">{m.overview_bezirke_stichtag({ stand })}</p>
		{/if}
	</header>

	<ul class="flex flex-col gap-4">
		{#each data.bezirke as bezirk (bezirk.slug)}
			<li data-testid="bezirk-overview-item" class="flex flex-col gap-2 border border-rule p-4">
				<a
					href={localizedHref(`/bezirk/${bezirk.slug}`)}
					class="hover:text-accent-strong w-fit font-serif text-xl text-accent underline underline-offset-2"
				>
					{bezirk.name}
				</a>
				{#if bezirk.einwohner !== null || bezirk.composite !== null}
					<dl class="flex flex-wrap gap-x-8 gap-y-1 font-sans text-sm">
						{#if bezirk.einwohner !== null}
							<div class="flex gap-2">
								<dt class="text-ink-muted">{m.bezirk_hero_fact_einwohner()}</dt>
								<dd class="font-mono text-ink tabular-nums">
									{formatCount(bezirk.einwohner, { locale })}
								</dd>
							</div>
						{/if}
						{#if bezirk.composite !== null}
							<div class="flex gap-2">
								<dt class="text-ink-muted">{m.meta_score_label_bezirk()}</dt>
								<dd class="font-mono text-ink tabular-nums">
									{m.kiez_hero_score_value({ score: bezirk.composite })}
								</dd>
							</div>
						{/if}
					</dl>
				{/if}
			</li>
		{/each}
	</ul>

	<p class="font-sans text-base">
		<a
			href={localizedHref('/kieze')}
			class="hover:text-accent-strong text-accent underline underline-offset-2"
		>
			{m.overview_bezirke_kieze_link()} →
		</a>
	</p>
</article>
