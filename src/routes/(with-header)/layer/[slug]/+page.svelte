<script lang="ts">
	import { page } from '$app/state';
	import {
		shortenSource,
		shortenLicense,
		formatYearMonth
	} from '$lib/components/atlas/inspector-panel/internal/source-shortener.js';
	import EditorialDisclaimer from '$lib/components/atlas/editorial-disclaimer.svelte';
	import ErrorFeedbackMailto from '$lib/components/atlas/error-feedback-mailto.svelte';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import FaqSection from '$lib/components/atlas/faq-section.svelte';
	import { buildDataset, buildBreadcrumbList, pickDatasetDescription } from '$lib/seo/index.js';
	import {
		getLayerDisplayName,
		bundleLabel,
		BUNDLE_LABEL_DE
	} from '$lib/components/atlas/internal/layer-palette-filter.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { formatCount } from '$lib/i18n/format.js';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const detail = $derived(data.detail);
	const meta = $derived(detail.meta);
	const explain = $derived(detail.explain);
	const methodology = $derived(detail.methodology);
	const locale = $derived(getLocale());
	const localeOpts = $derived({ locale });
	// i18n Block B4b, Review-Fund #6: einmal ableiten statt 9x wiederholen.
	const contentLang = $derived(locale === 'de' ? undefined : 'de');
	// i18n Block B4b, Spec Change Log 27.09. 06:20: JSON-LD bleibt bis zur
	// Registrierung vollständig deutsch (Boundary `inLanguage` `de-DE`) --
	// Name/Description/Breadcrumb-Einträge laufen deshalb NICHT über die
	// aktuelle URL-Locale, sondern immer über den DE-Default.
	const deLayerName = $derived(getLayerDisplayName(detail.slug));

	const inspectorHref = $derived(
		localizedHref(`/explore?layers=${encodeURIComponent(detail.slug)}`)
	);

	// i18n Block B4b, Spec Change Log 27.09. 06:20 (Review-Fund #19): DE zeigt
	// weiter den Rohwert aus dem Manifest (Zeichen-für-Zeichen-Parität), nur
	// EN läuft über `bundleLabel()` -- mit Roh-Fallback für unbekannte Werte
	// (defensiv, der Wert kommt zur Laufzeit aus `MANIFEST.json`).
	const bundleGroupLabel = $derived(
		locale === 'de'
			? meta.bundleGroup
			: Object.hasOwn(BUNDLE_LABEL_DE, meta.bundleGroup)
				? bundleLabel(meta.bundleGroup, localeOpts)
				: meta.bundleGroup
	);

	const descriptionFallback = $derived(
		m.layer_page_description_fallback({ layerName: detail.layerName }, localeOpts)
	);
	const pageTitle = $derived(m.layer_page_title({ layerName: detail.layerName }, localeOpts));
	const pageDescription = $derived(explain.short || descriptionFallback);
	const ogImageAlt = $derived(m.layer_page_og_alt({ layerName: detail.layerName }, localeOpts));
	const jsonLdDescriptionFallback = $derived(
		m.layer_page_description_fallback({ layerName: deLayerName }, { locale: 'de' })
	);

	/**
	 * Story 2.2 AC-5: Dataset-JSON-LD pro Layer-Detail-Page.
	 * i18n Block B4b: `inLanguage` bleibt bewusst `de-DE` (Default in
	 * `buildDataset`, wie B4a) -- Name, Description-Fallback und Breadcrumb-
	 * Namen folgen deshalb konsequent DE, nicht der URL-Locale (Spec Change
	 * Log, Review-Funde #3/#4/#19).
	 */
	const datasetJsonLd = $derived(
		buildDataset({
			origin: page.url.origin,
			name: deLayerName,
			description: pickDatasetDescription([explain.long, explain.short], jsonLdDescriptionFallback),
			license: meta.license,
			dateModified: meta.sourceUpdatedAt ?? meta.fetchedAt,
			creatorName: methodology?.authority,
			contentUrl: `${page.url.origin}/layers/${meta.filename}`,
			encodingFormat:
				meta.format === 'pmtiles' ? 'application/vnd.pmtiles' : 'application/geo+json',
			keywords: [meta.bundleGroup, detail.slug]
		})
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin: page.url.origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Daten', path: '/explore' },
				{ name: deLayerName, path: `/layer/${detail.slug}` }
			]
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={`${page.url.origin}/og/layer/${detail.slug}.png`}
	{ogImageAlt}
/>
<JsonLd data={datasetJsonLd} testid="layer-dataset-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="layer-breadcrumb-jsonld" />

<article
	data-testid="layer-detail-page"
	data-slug={detail.slug}
	class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8"
>
	<header class="flex flex-col gap-2">
		<p class="font-mono text-xs tracking-wide text-ink-subtle uppercase">
			{bundleGroupLabel}
		</p>
		<h1 data-testid="layer-detail-name" class="font-serif text-3xl text-ink">
			{detail.layerName}
		</h1>
		{#if explain.long}
			<p
				data-testid="layer-detail-lead"
				lang={contentLang}
				class="font-serif text-lg leading-relaxed text-ink-muted"
			>
				{explain.long}
			</p>
		{/if}
	</header>

	{#if detail.slug === 'kuehle-orte'}
		<a
			href={localizedHref('/hitze')}
			data-testid="layer-detail-hitze-link"
			class="inline-flex w-fit items-center gap-2 rounded border border-accent bg-accent px-4 py-2 font-mono text-sm tracking-wider text-bg uppercase hover:border-ink hover:bg-ink"
		>
			{m.layer_page_hitze_cta()}
		</a>
	{/if}

	{#if detail.editorial}
		<section data-testid="layer-detail-editorial" lang={contentLang}>
			{#each detail.editorial.disclaimerVariants as variant (variant)}
				<EditorialDisclaimer {variant} sourceUrl={detail.editorial.primarySourceUrl} />
			{/each}
		</section>
	{/if}

	<section
		data-testid="layer-detail-source-card"
		class="flex flex-col gap-2 border border-rule bg-bg-elevated p-4"
	>
		<h2 class="font-sans text-sm font-semibold tracking-wide text-ink-muted uppercase">
			{m.layer_page_source_heading()}
		</h2>
		<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
			<dt class="font-mono text-xs text-ink-subtle">{m.layer_page_provider_label()}</dt>
			<dd class="text-ink">
				{#if meta.sourceUrl.startsWith('https://navigator.berlin/derived')}
					<span data-testid="layer-detail-source-link">
						{m.layer_page_own_calculation_label()} (<a
							href={localizedHref('/lizenzen')}
							class="hover:text-accent-strong text-accent underline underline-offset-2"
							>{m.layer_page_own_calculation_link_label()}</a
						>)
					</span>
				{:else}
					<a
						data-testid="layer-detail-source-link"
						href={meta.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-accent-strong text-accent underline underline-offset-2"
					>
						{shortenSource(meta.sourceUrl)}
					</a>
				{/if}
			</dd>
			<dt class="font-mono text-xs text-ink-subtle">{m.layer_page_license_label()}</dt>
			<dd data-testid="layer-detail-license" class="font-mono text-xs text-ink">
				{shortenLicense(meta.license)}
			</dd>
			<dt class="font-mono text-xs text-ink-subtle">{m.layer_page_data_status_label()}</dt>
			<dd class="text-ink">
				{formatYearMonth(meta.sourceUpdatedAt ?? meta.fetchedAt)}
			</dd>
			<dt class="font-mono text-xs text-ink-subtle">{m.layer_page_features_label()}</dt>
			<dd class="font-mono text-xs text-ink">{formatCount(meta.featureCount, localeOpts)}</dd>
		</dl>
	</section>

	{#if explain.valueScaleExplain || explain.unit}
		<section data-testid="layer-detail-scale" class="flex flex-col gap-2 border border-rule p-4">
			<h2 class="font-sans text-sm font-semibold tracking-wide text-ink-muted uppercase">
				{m.layer_page_values_heading()}
			</h2>
			<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
				{#if explain.unit}
					<dt class="font-mono text-xs text-ink-subtle">{m.layer_page_unit_label()}</dt>
					<dd class="font-mono text-sm text-ink">{explain.unit}</dd>
				{/if}
				{#if explain.valueScaleExplain}
					<dt class="font-mono text-xs text-ink-subtle">{m.layer_page_scale_label()}</dt>
					<dd lang={contentLang} class="text-ink">
						{explain.valueScaleExplain}
					</dd>
				{/if}
			</dl>
		</section>
	{/if}

	{#if methodology}
		<section
			data-testid="layer-detail-methodology"
			aria-labelledby="layer-detail-methodology-h"
			class="flex flex-col gap-2 border border-rule p-4"
		>
			<h2
				id="layer-detail-methodology-h"
				class="font-sans text-sm font-semibold tracking-wide text-ink-muted uppercase"
			>
				{m.layer_page_calculation_heading()}
			</h2>
			{#if methodology.calculation}
				<p lang={contentLang} class="font-serif text-base leading-relaxed text-ink">
					{methodology.calculation}
				</p>
			{/if}
			<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
				{#if methodology.aggregationLevel}
					<dt class="font-mono text-xs text-ink-subtle">{m.layer_page_aggregation_label()}</dt>
					<dd lang={contentLang} class="font-mono text-xs text-ink">
						{methodology.aggregationLevel}
					</dd>
				{/if}
				{#if methodology.authority}
					<dt class="font-mono text-xs text-ink-subtle">{m.layer_page_maintenance_label()}</dt>
					<dd lang={contentLang} class="text-ink">
						{methodology.authority}
					</dd>
				{/if}
				{#if methodology.updateFrequency}
					<dt class="font-mono text-xs text-ink-subtle">{m.layer_page_update_frequency_label()}</dt>
					<dd lang={contentLang} class="text-ink">
						{methodology.updateFrequency}
					</dd>
				{/if}
			</dl>
		</section>

		{#if methodology.coverageGaps && methodology.coverageGaps.length > 0}
			<section
				data-testid="layer-detail-coverage-gaps"
				aria-labelledby="layer-detail-coverage-h"
				class="flex flex-col gap-2 border border-rule p-4"
			>
				<h2
					id="layer-detail-coverage-h"
					class="font-sans text-sm font-semibold tracking-wide text-ink-muted uppercase"
				>
					{m.layer_page_coverage_gaps_heading()}
				</h2>
				<ul lang={contentLang} class="list-disc pl-5 font-serif text-base text-ink">
					{#each methodology.coverageGaps as gap (gap)}
						<li>{gap}</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if methodology.omissions && methodology.omissions.length > 0}
			<section
				data-testid="layer-detail-omissions"
				aria-labelledby="layer-detail-omissions-h"
				class="flex flex-col gap-2 border border-rule p-4"
			>
				<h2
					id="layer-detail-omissions-h"
					class="font-sans text-sm font-semibold tracking-wide text-ink-muted uppercase"
				>
					{m.layer_page_omissions_heading()}
				</h2>
				<ul lang={contentLang} class="list-disc pl-5 font-serif text-base text-ink">
					{#each methodology.omissions as o (o)}
						<li>{o}</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if methodology.relatedLayers && methodology.relatedLayers.length > 0}
			<section
				data-testid="layer-detail-related"
				aria-labelledby="layer-detail-related-h"
				class="flex flex-col gap-2 border border-rule p-4"
			>
				<h2
					id="layer-detail-related-h"
					class="font-sans text-sm font-semibold tracking-wide text-ink-muted uppercase"
				>
					{m.layer_page_related_heading()}
				</h2>
				<ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-base">
					{#each methodology.relatedLayers as relSlug (relSlug)}
						<li>
							<a
								href={localizedHref(`/layer/${relSlug}`)}
								class="hover:text-accent-strong text-accent underline underline-offset-2"
							>
								{getLayerDisplayName(relSlug, localeOpts)}
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<aside data-testid="layer-detail-methodik-link" class="border border-rule bg-bg p-3">
			<p class="font-mono text-xs text-ink-muted">
				<a
					href={localizedHref('/methodik')}
					class="hover:text-accent-strong text-accent underline underline-offset-2"
				>
					{m.layer_page_methodik_link_label()}
				</a>
				{m.layer_page_methodik_suffix()}
			</p>
		</aside>
	{:else}
		<aside
			data-testid="layer-detail-methodology-empty"
			class="flex flex-col gap-2 border border-rule bg-bg p-4"
		>
			<p class="font-serif text-base text-ink">
				{m.layer_page_methodology_empty_text()}
			</p>
			<p class="font-mono text-xs text-ink-muted">
				<a
					href={localizedHref('/methodik')}
					class="hover:text-accent-strong text-accent underline underline-offset-2"
				>
					{m.layer_page_methodik_open_label()}
				</a>
			</p>
			<ErrorFeedbackMailto
				layerSlug={detail.slug}
				layerName={deLayerName}
				ariaLayerName={detail.layerName}
				sourceUrl={meta.sourceUrl}
				fetchedAt={meta.fetchedAt}
			/>
		</aside>
	{/if}

	<a
		data-testid="layer-detail-inspector-link"
		href={inspectorHref}
		class="hover:text-accent-strong inline-flex w-fit items-center gap-1 self-start text-base font-medium text-accent underline underline-offset-2"
	>
		{m.layer_page_inspector_link_label()} <span aria-hidden="true">→</span>
	</a>

	<FaqSection items={data.faq} pageType="layer" />
</article>
