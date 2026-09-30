<script lang="ts">
	import { ChevronDown, ChevronRight, Eye, EyeOff, ExternalLink } from '@lucide/svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { formatCount, formatDate } from '$lib/i18n/format.js';
	import ValueChip from '../value-chip.svelte';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import { getLayerDisplayName } from '../internal/layer-palette-filter.js';
	import { dimensionLabel, scaleFor } from './internal/kiez-score-display.js';
	import { severityDescriptions } from './internal/value-severity-mapping.js';
	import type { DimensionScore } from '$lib/data';

	type Props = {
		score: DimensionScore;
		/** Optional kontrolliert: wenn gesetzt, steuert der Konsument den Aufklapp-Zustand (z.B. via Ring-Klick). */
		open?: boolean;
		onToggle?: (dimension: DimensionScore['dimension']) => void;
		lang?: Locale;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
	};
	let { score, open, onToggle, lang, isActive = false, onToggleLayer }: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	const scale = $derived(scaleFor(score.value, score.dimension, localeOpts));
	const label = $derived(dimensionLabel(score.dimension, localeOpts));
	const hasSources = $derived(score.sources.length > 0);
	const layerSlug = $derived(`kiez-score-${score.dimension}`);
	const learnMoreHref = $derived(localizedHref(`/layer/${layerSlug}`, locale));
	let internalOpen = $state(false);
	const sourcesOpen = $derived(open ?? internalOpen);

	// Story 14.4: Kriminalität nach Delikt-Art aufschlüsseln. Die Roh-HZ (3-Jahres-Mittel pro
	// 100.000 Einwohner) liegen im rawValue der Single-Index-Quelle (build-kiez-scores).
	const KRIMINALITAET_DELIKT_ORDER = $derived<(readonly [string, string, string | undefined])[]>([
		[
			'kieztaten',
			m.inspector_kiez_score_delikt_kieztaten(undefined, localeOpts),
			m.inspector_kiez_score_delikt_kieztaten_hint(undefined, localeOpts)
		],
		[
			'wohnraumeinbruch',
			m.inspector_kiez_score_delikt_wohnraumeinbruch(undefined, localeOpts),
			undefined
		],
		[
			'sachbeschaedigung',
			m.inspector_kiez_score_delikt_sachbeschaedigung(undefined, localeOpts),
			undefined
		],
		['strassenraub', m.inspector_kiez_score_delikt_strassenraub(undefined, localeOpts), undefined],
		[
			'fahrraddiebstahl',
			m.inspector_kiez_score_delikt_fahrraddiebstahl(undefined, localeOpts),
			undefined
		]
	]);
	const krimiDelikte = $derived.by(() => {
		if (score.dimension !== 'kriminalitaet') return null;
		const raw = score.sources[0]?.rawValue as
			| { delikte?: Record<string, number | null> }
			| undefined;
		if (!raw || typeof raw !== 'object' || !raw.delikte) return null;
		return KRIMINALITAET_DELIKT_ORDER.map(([key, deliktLabel, hint]) => ({
			key,
			label: deliktLabel,
			hint: hint ?? null,
			hz: typeof raw.delikte?.[key] === 'number' ? (raw.delikte[key] as number) : null
		}));
	});

	function toggleSources(): void {
		if (onToggle) onToggle(score.dimension);
		else internalOpen = !internalOpen;
	}
</script>

<div data-testid="kiez-score-dim-{score.dimension}" data-dimension={score.dimension} class="py-1">
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
			<ValueChip
				severity={scale.severity}
				value={scale.label}
				layerName={label}
				severityDescriptions={severityDescriptions(localeOpts)}
			/>
		{:else}
			<span
				class="font-mono text-xs text-ink-subtle"
				data-testid="kiez-score-missing-{score.dimension}"
			>
				{m.inspector_kiez_score_missing(undefined, localeOpts)}
			</span>
		{/if}

		{#if onToggleLayer}
			<button
				type="button"
				data-testid="kiez-score-map-toggle-{score.dimension}"
				aria-pressed={isActive}
				aria-label={isActive
					? m.inspector_kiez_score_map_toggle_remove_dim({ label }, localeOpts)
					: m.inspector_kiez_score_map_toggle_add_dim({ label }, localeOpts)}
				title={isActive
					? m.inspector_common_map_toggle_remove_title(undefined, localeOpts)
					: m.inspector_common_map_toggle_add_title(undefined, localeOpts)}
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
			aria-label={m.inspector_kiez_score_learn_more_dim_aria({ label }, localeOpts)}
			title={m.inspector_common_learn_more_title(undefined, localeOpts)}
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
			<li class="text-[10px] tracking-wide text-ink-subtle uppercase">
				{m.inspector_kiez_score_delikt_heading(undefined, localeOpts)}
			</li>
			{#each krimiDelikte as d (d.key)}
				<li
					class="flex items-baseline justify-between gap-2"
					data-testid="kriminalitaet-delikt-{d.key}"
				>
					<span class="min-w-0 flex-1" title={d.hint ?? undefined}>
						{d.label}{#if d.hint}<span aria-hidden="true" class="ml-0.5 cursor-help text-ink-subtle"
								>*</span
							>{/if}
					</span>
					<span class="shrink-0 whitespace-nowrap text-ink-subtle tabular-nums">
						{d.hz === null ? '—' : formatCount(Math.round(d.hz), localeOpts)}
					</span>
				</li>
			{/each}
			{#if score.dataStand}
				<li class="pt-0.5 text-[10px] text-ink-subtle" data-testid="kiez-score-stand-kriminalitaet">
					{m.inspector_kiez_score_stand(
						{ date: formatDate(score.dataStand, localeOpts) },
						localeOpts
					)}
				</li>
			{/if}
		</ul>
		<div class="mt-1.5 border-l border-rule pl-[22px]">
			<EditorialDisclaimer variant="kriminalitaet-aggregat" />
		</div>
	{:else if hasSources && sourcesOpen}
		<ul
			class="mt-1 space-y-1 border-l border-rule pl-[22px] font-mono text-xs text-ink-muted"
			data-testid="kiez-score-sources-{score.dimension}"
		>
			{#each score.sources as src (src.layer)}
				<li class="flex items-baseline justify-between gap-2">
					<span class="min-w-0 flex-1">{getLayerDisplayName(src.layer, localeOpts)}</span>
					<span class="shrink-0 whitespace-nowrap text-ink-subtle">
						{src.normalizedValue === null ? '—' : `${Math.round(src.normalizedValue)}/100`}
						<span class="ml-1 text-[10px]">·</span>
						<span class="ml-1 text-[10px]"
							>{m.inspector_kiez_score_weight_label(
								{ pct: formatCount(Math.round(src.weight * 100), localeOpts) },
								localeOpts
							)}</span
						>
					</span>
				</li>
			{/each}
			{#if score.dataStand}
				<li
					class="pt-0.5 text-[10px] text-ink-subtle"
					data-testid="kiez-score-stand-{score.dimension}"
				>
					{m.inspector_kiez_score_stand(
						{ date: formatDate(score.dataStand, localeOpts) },
						localeOpts
					)}
				</li>
			{/if}
		</ul>
	{/if}
</div>
