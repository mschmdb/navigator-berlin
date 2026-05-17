<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import {
		shortenSource,
		shortenLicense,
		formatYearMonth
	} from '$lib/components/atlas/inspector-panel/internal/source-shortener.js';
	import EditorialDisclaimer from '$lib/components/atlas/editorial-disclaimer.svelte';
	import ErrorFeedbackMailto from '$lib/components/atlas/error-feedback-mailto.svelte';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import { buildDataset } from '$lib/seo/index.js';
	import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const detail = $derived(data.detail);
	const meta = $derived(detail.meta);
	const explain = $derived(detail.explain);
	const methodology = $derived(detail.methodology);
	const inspectorHref = $derived(
		(resolve as (path: string) => string)(`/explore?layers=${encodeURIComponent(detail.slug)}`)
	);
	const pageTitle = $derived(`${detail.layerName} - Berlin in Daten - navigator.berlin`);
	const pageDescription = $derived(
		explain.short || `Geo-Datenlayer ${detail.layerName} in Berlin.`
	);

	/**
	 * Story 2.2 AC-5: Dataset-JSON-LD pro Layer-Detail-Page.
	 * Phase 1 DE-only: `inLanguage: 'de-DE'` per Default in buildDataset.
	 * EN-Variante kommt mit Story 2.5a (`inLanguage: 'en-US'`-Override).
	 */
	const datasetJsonLd = $derived(
		buildDataset({
			origin: page.url.origin,
			name: detail.layerName,
			description: explain.long || explain.short || `Geo-Datenlayer ${detail.layerName} in Berlin.`,
			license: meta.license,
			dateModified: meta.sourceUpdatedAt ?? meta.fetchedAt,
			creatorName: methodology?.authority,
			contentUrl: `${page.url.origin}/layers/${meta.filename}`,
			encodingFormat:
				meta.format === 'pmtiles' ? 'application/vnd.pmtiles' : 'application/geo+json',
			keywords: [meta.bundleGroup, detail.slug]
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	pathname={page.url.pathname}
	origin={page.url.origin}
/>
<JsonLd data={datasetJsonLd} testid="layer-dataset-jsonld" />

<article
	data-testid="layer-detail-page"
	data-slug={detail.slug}
	class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8"
>
	<header class="flex flex-col gap-2">
		<p class="font-mono text-xs uppercase tracking-wide text-ink-subtle">
			{meta.bundleGroup}
		</p>
		<h1 data-testid="layer-detail-name" class="font-serif text-3xl text-ink">
			{detail.layerName}
		</h1>
		{#if explain.long}
			<p
				data-testid="layer-detail-lead"
				class="font-serif text-lg leading-relaxed text-ink-muted"
			>
				{explain.long}
			</p>
		{/if}
	</header>

	{#if detail.editorial}
		<section data-testid="layer-detail-editorial">
			{#each detail.editorial.disclaimerVariants as variant (variant)}
				<EditorialDisclaimer
					{variant}
					sourceUrl={detail.editorial.primarySourceUrl}
				/>
			{/each}
		</section>
	{/if}

	<section
		data-testid="layer-detail-source-card"
		class="flex flex-col gap-2 border border-rule bg-bg-elevated p-4"
	>
		<h2 class="font-sans text-sm font-semibold uppercase tracking-wide text-ink-muted">Quelle</h2>
		<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
			<dt class="font-mono text-xs text-ink-subtle">Anbieter</dt>
			<dd class="text-ink">
				<a
					data-testid="layer-detail-source-link"
					href={meta.sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>
					{shortenSource(meta.sourceUrl)}
				</a>
			</dd>
			<dt class="font-mono text-xs text-ink-subtle">Lizenz</dt>
			<dd data-testid="layer-detail-license" class="font-mono text-xs text-ink">
				{shortenLicense(meta.license)}
			</dd>
			<dt class="font-mono text-xs text-ink-subtle">Datenstand</dt>
			<dd class="text-ink">
				{formatYearMonth(meta.sourceUpdatedAt ?? meta.fetchedAt)}
			</dd>
			<dt class="font-mono text-xs text-ink-subtle">Features</dt>
			<dd class="font-mono text-xs text-ink">{meta.featureCount.toLocaleString('de-DE')}</dd>
		</dl>
	</section>

	{#if explain.valueScaleExplain || explain.unit}
		<section
			data-testid="layer-detail-scale"
			class="flex flex-col gap-2 border border-rule p-4"
		>
			<h2 class="font-sans text-sm font-semibold uppercase tracking-wide text-ink-muted">
				Werte
			</h2>
			<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
				{#if explain.unit}
					<dt class="font-mono text-xs text-ink-subtle">Einheit</dt>
					<dd class="font-mono text-sm text-ink">{explain.unit}</dd>
				{/if}
				{#if explain.valueScaleExplain}
					<dt class="font-mono text-xs text-ink-subtle">Skala</dt>
					<dd class="text-ink">{explain.valueScaleExplain}</dd>
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
				class="font-sans text-sm font-semibold uppercase tracking-wide text-ink-muted"
			>
				Berechnung
			</h2>
			{#if methodology.calculation}
				<p class="font-serif text-base leading-relaxed text-ink">
					{methodology.calculation}
				</p>
			{/if}
			<dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
				{#if methodology.aggregationLevel}
					<dt class="font-mono text-xs text-ink-subtle">Aggregation</dt>
					<dd class="font-mono text-xs text-ink">{methodology.aggregationLevel}</dd>
				{/if}
				{#if methodology.authority}
					<dt class="font-mono text-xs text-ink-subtle">Pflege</dt>
					<dd class="text-ink">{methodology.authority}</dd>
				{/if}
				{#if methodology.updateFrequency}
					<dt class="font-mono text-xs text-ink-subtle">Aktualisierung</dt>
					<dd class="text-ink">{methodology.updateFrequency}</dd>
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
					class="font-sans text-sm font-semibold uppercase tracking-wide text-ink-muted"
				>
					Coverage-Lücken
				</h2>
				<ul class="list-disc pl-5 font-serif text-base text-ink">
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
					class="font-sans text-sm font-semibold uppercase tracking-wide text-ink-muted"
				>
					Was wir NICHT zeigen
				</h2>
				<ul class="list-disc pl-5 font-serif text-base text-ink">
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
					class="font-sans text-sm font-semibold uppercase tracking-wide text-ink-muted"
				>
					Verwandte Layer
				</h2>
				<ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-base">
					{#each methodology.relatedLayers as relSlug (relSlug)}
						<li>
							<a
								href={`/layer/${relSlug}`}
								class="text-accent underline underline-offset-2 hover:text-accent-strong"
							>
								{getLayerDisplayName(relSlug)}
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<aside
			data-testid="layer-detail-methodik-link"
			class="border border-rule bg-bg p-3"
		>
			<p class="font-mono text-xs text-ink-muted">
				<a
					href="/methodik"
					class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>
					Methodik
				</a>
				· Datenarchitektur, Aggregations-Ebenen, was wir nicht zeigen.
			</p>
		</aside>
	{:else}
		<aside
			data-testid="layer-detail-methodology-empty"
			class="flex flex-col gap-2 border border-rule bg-bg p-4"
		>
			<p class="font-serif text-base text-ink">
				Methodik in Vorbereitung. Wir dokumentieren diesen Layer derzeit noch nicht
				vollständig.
			</p>
			<p class="font-mono text-xs text-ink-muted">
				<a
					href="/methodik"
					class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>
					Methodik öffnen
				</a>
			</p>
			<ErrorFeedbackMailto
				layerSlug={detail.slug}
				layerName={detail.layerName}
				sourceUrl={meta.sourceUrl}
				fetchedAt={meta.fetchedAt}
			/>
		</aside>
	{/if}

	<a
		data-testid="layer-detail-inspector-link"
		href={inspectorHref}
		class="inline-flex w-fit items-center gap-1 self-start text-base font-medium text-accent underline underline-offset-2 hover:text-accent-strong"
	>
		Layer auf Karte anschauen →
	</a>
</article>
