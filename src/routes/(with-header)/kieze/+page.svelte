<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import Breadcrumb from '$lib/components/atlas/breadcrumb.svelte';
	import { bezirkAnchorId } from '$lib/data/region-overview.js';
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
	const kiezCount = $derived(data.bezirke.reduce((sum, b) => sum + b.kieze.length, 0));
	// Gruppen ohne Kieze würden eine leere Liste mit Überschrift rendern.
	const shownBezirke = $derived(data.bezirke.filter((b) => b.kieze.length > 0));
	const bezirkCount = $derived(shownBezirke.length);

	const breadcrumbItems = $derived([
		{ name: 'Berlin', path: '/' },
		{ name: m.overview_kieze_breadcrumb(), path: '/kieze' }
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
	title={buildPageTitle(m.overview_kieze_meta_title({ count: kiezCount }))}
	description={m.overview_kieze_meta_description({ count: kiezCount })}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}${DEFAULT_OG_IMAGE_PATH}`}
	ogImageAlt={m.overview_og_image_alt()}
/>
<JsonLd data={breadcrumbJsonLd} testid="kieze-breadcrumb-jsonld" />

<div class="mx-auto max-w-3xl px-4 pt-6">
	<Breadcrumb items={breadcrumbItems} />
</div>

<article data-testid="kieze-overview" class="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
	<header class="flex flex-col gap-3">
		<h1 class="font-serif text-3xl text-ink">{m.overview_kieze_h1()}</h1>
		<p class="font-serif text-lg leading-relaxed text-ink-muted">
			{m.overview_kieze_intro({ count: kiezCount, bezirkCount })}
		</p>
		<p class="font-sans text-base">
			<a
				href={localizedHref('/methodik/kiez-score')}
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				{m.kiez_page_methodik_link_label()} →
			</a>
		</p>
	</header>

	<nav aria-label={m.overview_kieze_jump_aria()} class="border border-rule bg-bg p-4">
		<ul class="flex flex-wrap gap-x-4 gap-y-1 font-sans text-sm">
			{#each shownBezirke as bezirk (bezirk.slug)}
				<li>
					<a
						href={`#${bezirkAnchorId(bezirk.slug)}`}
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						{bezirk.name}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	{#each shownBezirke as bezirk (bezirk.slug)}
		<section
			id={bezirkAnchorId(bezirk.slug)}
			aria-labelledby={`${bezirkAnchorId(bezirk.slug)}-h`}
			class="flex scroll-mt-4 flex-col gap-3 border-t border-rule pt-6"
		>
			<header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<h2 id={`${bezirkAnchorId(bezirk.slug)}-h`} class="font-serif text-2xl text-ink">
					{bezirk.name}
				</h2>
				<p class="font-sans text-sm text-ink-muted">
					{bezirk.kieze.length === 1
						? m.overview_kieze_bezirk_count_single()
						: m.overview_kieze_bezirk_count_plural({ count: bezirk.kieze.length })}
					<span aria-hidden="true">·</span>
					<a
						href={localizedHref(`/bezirk/${bezirk.slug}`)}
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						{m.overview_kieze_bezirk_link({ name: bezirk.name })}
					</a>
				</p>
			</header>
			<ul class="grid gap-x-8 font-sans text-base sm:grid-cols-2">
				{#each bezirk.kieze as kiez (kiez.slug)}
					<li
						data-testid="kiez-overview-item"
						class="flex items-baseline justify-between gap-3 border-b border-rule/40 py-1.5"
					>
						<a
							href={localizedHref(`/kiez/${kiez.slug}`)}
							class="hover:text-accent-strong text-accent underline underline-offset-2"
						>
							{kiez.name}
						</a>
						<span class="font-mono text-sm text-ink-muted tabular-nums">
							{#if kiez.composite !== null}
								<span aria-hidden="true">{kiez.composite}</span>
								<span class="sr-only">{m.bezirk_kieze_score_aria({ score: kiez.composite })}</span>
							{:else}
								<span aria-hidden="true">{m.overview_no_score_short()}</span>
								<span class="sr-only">{m.bezirk_kieze_no_score()}</span>
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</article>
