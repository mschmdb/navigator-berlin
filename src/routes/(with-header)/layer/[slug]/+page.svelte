<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import {
		shortenSource,
		shortenLicense,
		formatYearMonth
	} from '$lib/components/atlas/inspector-panel/internal/source-shortener.js';
	import EditorialDisclaimer from '$lib/components/atlas/editorial-disclaimer.svelte';

	type Props = { data: import('./$types').PageData };
	let { data }: Props = $props();

	const detail = $derived(data.detail);
	const meta = $derived(detail.meta);
	const explain = $derived(detail.explain);
	const inspectorHref = $derived(
		resolve(`/?layers=${encodeURIComponent(detail.slug)}` as Pathname)
	);
	const pageTitle = $derived(`${detail.layerName} · Berlin Navigator`);
	const pageDescription = $derived(
		explain.short || `Geo-Datenlayer ${detail.layerName} in Berlin.`
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
</svelte:head>

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

	<a
		data-testid="layer-detail-inspector-link"
		href={inspectorHref}
		class="inline-flex w-fit items-center gap-1 self-start text-base font-medium text-accent underline underline-offset-2 hover:text-accent-strong"
	>
		Layer auf Karte anschauen →
	</a>
</article>
