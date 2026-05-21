<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import { ExternalLink, Eye, EyeOff } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import DataStandBanner from './data-stand-banner.svelte';
	import { getLayerHitDisplay } from './internal/layer-hit-display.js';
	import { getValueSeverity } from './internal/value-severity-mapping.js';
	import {
		getLayerExplainEntry,
		getLayerExternalLink
	} from './internal/layer-explain.js';
	import { isOutdated } from './internal/source-shortener.js';
	import { getEditorialConfig } from '../internal/editorial-config.js';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import MauerSektorenDetail from '../mauer-sektoren-detail.svelte';
	import ValueChip from '../value-chip.svelte';

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

	type RowState =
		| 'with-value'
		| 'no-coverage'
		| 'coverage-out-of-scope'
		| 'out-of-concept'
		| 'seasonal'
		| 'outdated';

	const display = $derived(getLayerHitDisplay(hit.layer, hit.value));
	const severity = $derived(getValueSeverity(hit.layer, hit.value));
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
		if (hit.reason === 'coverage-out-of-scope') return 'coverage-out-of-scope';
		if (hit.reason === 'out-of-concept') return 'out-of-concept';
		if (hit.reason === 'no-coverage') return 'no-coverage';
		if (hit.reason === 'seasonal') return 'seasonal';
		if (outdated) return 'outdated';
		return 'with-value';
	});

	const valueText = $derived.by(() => {
		if (rowState === 'no-coverage') return 'Daten nicht vorhanden';
		if (rowState === 'coverage-out-of-scope') return 'Datensatz deckt diese Lage nicht ab';
		if (rowState === 'out-of-concept') return 'Nicht ausgewiesen für diese Lage';
		if (rowState === 'seasonal') return 'Layer Mai–Oktober aktiv';
		if (display.chip) {
			return display.chip.unit
				? `${display.chip.value} ${display.chip.unit}`
				: display.chip.value;
		}
		if (display.fallbackText) return display.fallbackText;
		return 'Daten nicht vorhanden';
	});

	const groupLabel = $derived(`${layerName}: ${valueText}`);

	const learnMoreHref = $derived(
		(resolve as (path: string) => string)(`/${lang}/layer/${hit.layer}`)
	);

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
	class="-mx-2 flex flex-col gap-1.5 rounded-sm border-b border-rule px-2 py-3 transition-colors last:border-b-0 hover:bg-bg/50"
>
	<div class="flex flex-col gap-1.5">
		<span class="text-base font-medium text-ink leading-tight" data-testid="layer-name">
			{layerName}
		</span>
		<div
			class="flex flex-wrap items-center justify-end gap-1.5"
			data-testid="layer-hit-row-actions"
		>
			{#if rowState === 'with-value' && display.chip}
				<ValueChip
					{severity}
					value={display.chip.value}
					unit={display.chip.unit}
					numeric={display.chip.numeric}
					{layerName}
				/>
			{:else if rowState === 'with-value' && display.fallbackText}
				<span class="text-base font-semibold text-ink" data-testid="value">
					{display.fallbackText}
				</span>
			{:else if rowState === 'no-coverage'}
				<span
					class="font-serif italic text-ink-subtle text-sm"
					data-testid="value-no-coverage"
				>
					Daten nicht vorhanden
				</span>
			{:else if rowState === 'coverage-out-of-scope'}
				<span
					class="font-serif italic text-ink-subtle text-sm"
					data-testid="value-coverage-out-of-scope"
				>
					Datensatz deckt diese Lage nicht ab
				</span>
			{:else if rowState === 'out-of-concept'}
				<span
					class="font-serif italic text-ink-subtle text-sm"
					data-testid="value-out-of-concept"
				>
					Nicht ausgewiesen für diese Lage
				</span>
			{:else if rowState === 'seasonal'}
				<span class="font-mono text-sm text-ink-muted" data-testid="value-seasonal">
					Layer Mai–Oktober aktiv
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
						'inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-muted hover:bg-bg hover:text-ink',
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
				class="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-muted hover:bg-bg hover:text-ink"
				data-testid="learn-more"
				aria-label={`Mehr Details über ${layerName}`}
				title={`Mehr Details über ${layerName}`}
			>
				<ExternalLink size={14} aria-hidden="true" />
				<span class="sr-only">Mehr Details</span>
			</a>
		</div>
	</div>

	{#if display.context}
		<p class="text-sm text-ink-muted" data-testid="row-context">{display.context}</p>
	{/if}

	{#if explain}
		<p class="font-serif text-sm leading-snug text-ink-muted" data-testid="explain">
			{explain}
		</p>
	{/if}
	{#if hasMore}
		{#if showMore}
			<p data-testid="explain-long" class="font-serif text-sm leading-snug text-ink-muted">
				{explainEntry.long}
			</p>
			{#if explainEntry.valueScaleExplain}
				<p data-testid="explain-scale" class="font-mono text-xs text-ink-subtle">
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
	{#if externalLink && rowState === 'with-value'}
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
		<EditorialDisclaimer {variant} sourceUrl={editorial?.primarySourceUrl} />
	{/each}
	{#if showMauerDetail}
		<MauerSektorenDetail fetchedAt={hit.updatedAt} />
	{/if}
</div>
