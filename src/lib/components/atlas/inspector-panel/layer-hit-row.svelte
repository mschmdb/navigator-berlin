<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import { ExternalLink, Eye, EyeOff } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import DataStandBanner from './data-stand-banner.svelte';
	import { formatLayerValue } from './internal/value-formatters.js';
	import {
		getLayerExplainEntry,
		getLayerExternalLink
	} from './internal/layer-explain.js';
	import { isOutdated } from './internal/source-shortener.js';
	import { getEditorialConfig } from '../internal/editorial-config.js';
	import type {
		StolpersteinFeature,
		StolpersteinProperties
	} from '../internal/editorial-types.js';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import StolpersteinDetail from '../stolperstein-detail.svelte';
	import MauerSektorenDetail from '../mauer-sektoren-detail.svelte';

	type Props = {
		hit: LayerHit;
		layerName: string;
		lang?: string;
		lat?: number;
		lng?: number;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
	};

	let {
		hit,
		layerName,
		lang = 'de',
		lat,
		lng,
		isActive = false,
		onToggleLayer
	}: Props = $props();

	let showMore = $state(false);
	function toggleMore(): void {
		showMore = !showMore;
	}

	type RowState = 'with-value' | 'no-coverage' | 'seasonal' | 'outdated';

	const formatted = $derived(formatLayerValue(hit.layer, hit.value));
	const explainEntry = $derived(getLayerExplainEntry(hit.layer));
	const explain = $derived(explainEntry.short);
	const hasMore = $derived(
		Boolean(
			explainEntry.long &&
				(explainEntry.long !== explainEntry.short || explainEntry.valueScaleExplain)
		)
	);
	const externalLink = $derived(getLayerExternalLink(hit.layer));
	const outdated = $derived(isOutdated(hit.updatedAt));
	const editorial = $derived(getEditorialConfig(hit.layer));

	const rowState: RowState = $derived.by(() => {
		if (hit.reason === 'no-coverage') return 'no-coverage';
		if (hit.reason === 'seasonal') return 'seasonal';
		if (outdated) return 'outdated';
		return 'with-value';
	});

	const valueText = $derived.by(() => {
		if (rowState === 'no-coverage') return 'Daten nicht vorhanden';
		if (rowState === 'seasonal') return 'Layer Mai–Oktober aktiv';
		return formatted.text;
	});

	const groupLabel = $derived(`${layerName}: ${valueText}`);

	const learnMoreHref = $derived(resolve(`/${lang}/layer/${hit.layer}` as Pathname));

	const showSeasonalActivePill = $derived(
		hit.layer === 'trinkbrunnen' && rowState === 'with-value'
	);
	const showSeasonalOutOfSeasonPill = $derived(
		hit.layer === 'trinkbrunnen' && rowState === 'seasonal'
	);

	const disclaimerVariants = $derived.by(() => {
		if (!editorial) return [];
		return editorial.disclaimerVariants.filter((v) => {
			if (v === 'seasonal') return rowState === 'seasonal';
			return true;
		});
	});

	function asStolpersteinProperties(v: unknown): StolpersteinProperties | null {
		if (!v || typeof v !== 'object') return null;
		return v as StolpersteinProperties;
	}

	const stolpersteinFeature = $derived.by((): StolpersteinFeature | null => {
		if (editorial?.customComponent !== 'StolpersteinDetail') return null;
		const props = asStolpersteinProperties(hit.value);
		if (!props) return null;
		return {
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [lng ?? 0, lat ?? 0] },
			properties: props
		};
	});

	const showMauerDetail = $derived(
		editorial?.customComponent === 'MauerSektorenDetail' && rowState === 'with-value'
	);
</script>

<div
	role="group"
	aria-label={groupLabel}
	data-testid="layer-hit-row"
	data-state={rowState}
	data-layer={hit.layer}
	class="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b border-rule py-3 last:border-b-0"
>
	<div class="flex flex-col gap-1">
		<div class="flex flex-wrap items-baseline gap-x-3">
			<span class="text-base font-medium text-ink" data-testid="layer-name">
				{layerName}
			</span>
			{#if rowState === 'no-coverage'}
				<span
					class="font-serif italic text-ink-subtle"
					data-testid="value-no-coverage"
				>
					Daten nicht vorhanden
				</span>
			{:else if rowState === 'seasonal'}
				<span class="font-mono text-sm text-ink-muted" data-testid="value-seasonal">
					Layer Mai–Oktober aktiv
				</span>
			{:else if formatted.isNumeric}
				<span class="font-mono text-base font-semibold text-ink tabular-nums" data-testid="value">
					{valueText}
				</span>
			{:else}
				<span class="text-base font-semibold text-ink" data-testid="value">
					{valueText}
				</span>
			{/if}
			{#if showSeasonalActivePill}
				<span
					data-testid="seasonal-pill-active"
					class="inline-flex items-center rounded-sm bg-state-success/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-state-success"
				>
					aktiv (Mai–Oktober)
				</span>
			{:else if showSeasonalOutOfSeasonPill}
				<span
					data-testid="seasonal-pill-outofseason"
					class="inline-flex items-center rounded-sm bg-state-warning/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-state-warning"
				>
					außerhalb der Saison
				</span>
			{/if}
		</div>
		{#if explain}
			<p class="font-serif text-sm leading-snug text-ink-muted" data-testid="explain">
				{explain}
			</p>
		{/if}
		{#if hasMore}
			{#if showMore}
				<p
					data-testid="explain-long"
					class="font-serif text-sm leading-snug text-ink-muted"
				>
					{explainEntry.long}
				</p>
				{#if explainEntry.valueScaleExplain}
					<p
						data-testid="explain-scale"
						class="font-mono text-xs text-ink-subtle"
					>
						{explainEntry.valueScaleExplain}
					</p>
				{/if}
			{/if}
			<button
				type="button"
				data-testid="explain-more"
				data-state={showMore ? 'open' : 'closed'}
				aria-expanded={showMore}
				onclick={toggleMore}
				class="self-start text-xs font-medium text-accent underline-offset-2 hover:underline"
			>
				{showMore ? 'Weniger' : 'Mehr'}
			</button>
		{/if}
		{#if externalLink && rowState !== 'no-coverage'}
			<a
				href={externalLink.href}
				target="_blank"
				rel="noopener noreferrer"
				data-testid="external-link"
				class="inline-flex w-fit items-center gap-1 font-sans text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				<ExternalLink size={12} aria-hidden="true" />
				{externalLink.label}
			</a>
		{/if}
		<DataStandBanner {hit} />
		{#each disclaimerVariants as variant (variant)}
			<EditorialDisclaimer
				{variant}
				sourceUrl={editorial?.primarySourceUrl}
			/>
		{/each}
		{#if stolpersteinFeature}
			<StolpersteinDetail feature={stolpersteinFeature} fetchedAt={hit.updatedAt} />
		{/if}
		{#if showMauerDetail}
			<MauerSektorenDetail fetchedAt={hit.updatedAt} />
		{/if}
	</div>
	<div
		class="flex shrink-0 flex-col items-end gap-1.5 pt-1 text-sm"
		data-testid="layer-hit-row-actions"
	>
		{#if rowState === 'outdated'}
			<span
				data-testid="outdated-pill"
				class="inline-flex items-center rounded-sm bg-state-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-state-warning"
				title={`Datenstand: ${hit.updatedAt}`}
			>
				Veraltet
			</span>
		{/if}
		<div class="flex items-center gap-1">
			{#if onToggleLayer}
				<button
					type="button"
					data-testid="map-toggle"
					data-state={isActive ? 'on' : 'off'}
					aria-pressed={isActive}
					aria-label={isActive
						? `${layerName} von Karte entfernen`
						: `${layerName} auf Karte zeigen`}
					title={isActive
						? `${layerName} von Karte entfernen`
						: `${layerName} auf Karte zeigen`}
					onclick={() => onToggleLayer?.(hit.layer)}
					class={[
						'inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-muted hover:text-ink',
						isActive && 'text-accent hover:text-accent-strong'
					]
						.filter(Boolean)
						.join(' ')}
				>
					{#if isActive}
						<EyeOff size={16} aria-hidden="true" />
					{:else}
						<Eye size={16} aria-hidden="true" />
					{/if}
				</button>
			{/if}
			<a
				href={learnMoreHref}
				class="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-muted hover:text-ink"
				data-testid="learn-more"
				aria-label={`Mehr Details über ${layerName}`}
				title={`Mehr Details über ${layerName}`}
			>
				<ExternalLink size={14} aria-hidden="true" />
				<span class="sr-only">Mehr Details</span>
			</a>
		</div>
	</div>
</div>
