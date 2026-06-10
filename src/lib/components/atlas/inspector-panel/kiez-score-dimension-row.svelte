<script lang="ts">
	import { ChevronDown, ChevronRight, Eye, EyeOff, ExternalLink } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import ValueChip from '../value-chip.svelte';
	import { getLayerDisplayName } from '../internal/layer-palette-filter.js';
	import { DIMENSION_LABELS_DE, scaleFor } from './internal/kiez-score-display.js';
	import type { DimensionScore } from '$lib/data';

	type Props = {
		score: DimensionScore;
		/** Optional kontrolliert: wenn gesetzt, steuert der Konsument den Aufklapp-Zustand (z.B. via Ring-Klick). */
		open?: boolean;
		onToggle?: (dimension: DimensionScore['dimension']) => void;
		lang?: string;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
	};
	let { score, open, onToggle, lang = 'de', isActive = false, onToggleLayer }: Props = $props();

	const scale = $derived(scaleFor(score.value, score.dimension));
	const label = $derived(DIMENSION_LABELS_DE[score.dimension]);
	const hasSources = $derived(score.sources.length > 0);
	const layerSlug = $derived(`kiez-score-${score.dimension}`);
	const learnMoreHref = $derived((resolve as (p: string) => string)(`/${lang}/layer/${layerSlug}`));
	let internalOpen = $state(false);
	const sourcesOpen = $derived(open ?? internalOpen);

	// Story 14.4: Kriminalität nach Delikt-Art aufschlüsseln. Die Roh-HZ (3-Jahres-Mittel pro
	// 100.000 Einwohner) liegen im rawValue der Single-Index-Quelle (build-kiez-scores).
	const KRIMINALITAET_DELIKT_ORDER: readonly (readonly [string, string])[] = [
		['kieztaten', 'Kieztaten'],
		['wohnraumeinbruch', 'Wohnraumeinbruch'],
		['sachbeschaedigung', 'Sachbeschädigung'],
		['strassenraub', 'Straßenraub/Handtaschenraub'],
		['fahrraddiebstahl', 'Fahrraddiebstahl']
	];
	const hzFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
	const krimiDelikte = $derived.by(() => {
		if (score.dimension !== 'kriminalitaet') return null;
		const raw = score.sources[0]?.rawValue as { delikte?: Record<string, number | null> } | undefined;
		if (!raw || typeof raw !== 'object' || !raw.delikte) return null;
		return KRIMINALITAET_DELIKT_ORDER.map(([key, deliktLabel]) => ({
			key,
			label: deliktLabel,
			hz: typeof raw.delikte?.[key] === 'number' ? (raw.delikte[key] as number) : null
		}));
	});

	function toggleSources(): void {
		if (onToggle) onToggle(score.dimension);
		else internalOpen = !internalOpen;
	}
</script>

<div
	data-testid="kiez-score-dim-{score.dimension}"
	data-dimension={score.dimension}
	class="py-1"
>
	<div class="flex items-center gap-2 py-1">
		{#if hasSources}
			<button
				type="button"
				onclick={toggleSources}
				aria-expanded={sourcesOpen}
				data-testid="kiez-score-toggle-sources-{score.dimension}"
				class="flex flex-1 items-center gap-2 text-left hover:text-accent"
			>
				{#if sourcesOpen}
					<ChevronDown size={14} class="shrink-0 text-ink-subtle" aria-hidden="true" />
				{:else}
					<ChevronRight size={14} class="shrink-0 text-ink-subtle" aria-hidden="true" />
				{/if}
				<span class="font-sans text-sm font-medium text-ink">{label}</span>
			</button>
		{:else}
			<span class="flex-1 pl-[22px] font-sans text-sm font-medium text-ink">{label}</span>
		{/if}

		{#if scale}
			<ValueChip severity={scale.severity} value={scale.label} layerName={label} />
		{:else}
			<span
				class="font-mono text-xs text-ink-subtle"
				data-testid="kiez-score-missing-{score.dimension}"
			>
				Daten unzureichend
			</span>
		{/if}

		{#if onToggleLayer}
			<button
				type="button"
				data-testid="kiez-score-map-toggle-{score.dimension}"
				aria-pressed={isActive}
				aria-label={isActive ? `${label} von Karte entfernen` : `${label} auf Karte zeigen`}
				title={isActive ? 'Von Karte entfernen' : 'Auf Karte zeigen'}
				onclick={() => onToggleLayer?.(layerSlug)}
				class={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm hover:bg-bg ${isActive ? 'text-accent' : 'text-ink-subtle hover:text-ink'}`}
			>
				{#if isActive}<EyeOff size={14} aria-hidden="true" />{:else}<Eye
						size={14}
						aria-hidden="true"
					/>{/if}
			</button>
		{/if}
		<a
			href={learnMoreHref}
			data-testid="kiez-score-learn-more-{score.dimension}"
			aria-label={`Mehr über ${label}`}
			title="Layer-Details"
			class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-ink-subtle hover:bg-bg hover:text-ink"
		>
			<ExternalLink size={13} aria-hidden="true" />
		</a>
	</div>

	{#if krimiDelikte && sourcesOpen}
		<ul
			class="mt-1 space-y-1 border-l border-rule pl-[22px] font-mono text-xs text-ink-muted"
			data-testid="kiez-score-delikte-kriminalitaet"
		>
			<li class="text-[10px] uppercase tracking-wide text-ink-subtle">
				Häufigkeitszahl je Delikt (Fälle pro 100.000 Ew., 3-Jahres-Mittel)
			</li>
			{#each krimiDelikte as d (d.key)}
				<li class="flex items-baseline justify-between gap-2" data-testid="kriminalitaet-delikt-{d.key}">
					<span class="min-w-0 flex-1">{d.label}</span>
					<span class="shrink-0 whitespace-nowrap tabular-nums text-ink-subtle">
						{d.hz === null ? '—' : hzFormatter.format(d.hz)}
					</span>
				</li>
			{/each}
			{#if score.dataStand}
				<li class="pt-0.5 text-[10px] text-ink-subtle" data-testid="kiez-score-stand-kriminalitaet">
					Stand: {new Date(score.dataStand).toLocaleDateString('de-DE')}
				</li>
			{/if}
		</ul>
	{:else if hasSources && sourcesOpen}
		<ul
			class="mt-1 space-y-1 border-l border-rule pl-[22px] font-mono text-xs text-ink-muted"
			data-testid="kiez-score-sources-{score.dimension}"
		>
			{#each score.sources as src (src.layer)}
				<li class="flex items-baseline justify-between gap-2">
					<span class="min-w-0 flex-1">{getLayerDisplayName(src.layer)}</span>
					<span class="shrink-0 whitespace-nowrap text-ink-subtle">
						{src.normalizedValue === null ? '—' : `${Math.round(src.normalizedValue)}/100`}
						<span class="ml-1 text-[10px]">·</span>
						<span class="ml-1 text-[10px]">w {Math.round(src.weight * 100)}%</span>
					</span>
				</li>
			{/each}
			{#if score.dataStand}
				<li
					class="pt-0.5 text-[10px] text-ink-subtle"
					data-testid="kiez-score-stand-{score.dimension}"
				>
					Stand: {new Date(score.dataStand).toLocaleDateString('de-DE')}
				</li>
			{/if}
		</ul>
	{/if}
</div>
