<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import type { NumericMedianAggregate } from '$lib/data/layer-aggregates-types.js';
	import type { Snippet } from 'svelte';
	import { Eye, EyeOff } from '@lucide/svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { formatDecimal, formatWithUnit } from '$lib/i18n/format.js';
	import { getValueSeverity } from './internal/value-severity-mapping.js';
	import ScoreBar from '../charts/score-bar.svelte';

	type Props = {
		hit: LayerHit;
		layerName: string;
		lang?: Locale;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
		kiezName: string | null;
		kiezAggregate: NumericMedianAggregate | null;
		bezirkName: string | null;
		bezirkAggregate: NumericMedianAggregate | null;
		berlinAggregate: NumericMedianAggregate | null;
		/** GH-88: Score-Zugehörigkeit direkt unter dem Titel. */
		afterTitle?: Snippet;
	};

	let {
		hit,
		layerName,
		lang,
		isActive = false,
		onToggleLayer,
		kiezName,
		kiezAggregate,
		bezirkName,
		bezirkAggregate,
		berlinAggregate,
		afterTitle
	}: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	function fmt(n: number): string {
		return formatDecimal(n, { ...localeOpts, maximumFractionDigits: 1 });
	}

	function celsius(n: number): string {
		return formatWithUnit(n, '°C', localeOpts);
	}

	function petOf(value: unknown): number | null {
		if (value && typeof value === 'object' && 'pet14h' in value) {
			const p = (value as Record<string, unknown>).pet14h;
			if (typeof p === 'number' && Number.isFinite(p)) return p;
		}
		return null;
	}

	const addressPet = $derived(petOf(hit.value));
	const severity = $derived(getValueSeverity('klima-pet-2022', hit.value));
	const scale = $derived(kiezAggregate?.median != null ? kiezAggregate : (berlinAggregate ?? null));

	// Fallback-Labels teilen sich dieselben Keys wie die Umfeld-Zeilen der übrigen Datensätze
	// (`internal/context-rows.ts`).
	const contextRows = $derived(
		[
			{
				id: 'kiez',
				label: kiezName ?? m.inspector_context_row_kiez_fallback(undefined, localeOpts),
				agg: kiezAggregate
			},
			{
				id: 'bezirk',
				label: bezirkName ?? m.inspector_context_row_bezirk_fallback(undefined, localeOpts),
				agg: bezirkAggregate
			},
			{
				id: 'berlin',
				label: m.inspector_context_row_berlin(undefined, localeOpts),
				agg: berlinAggregate
			}
		].filter(
			(r): r is { id: string; label: string; agg: NumericMedianAggregate } => r.agg?.median != null
		)
	);

	// GH-88: Titel führt zur Layer-Seite, Quelle und Details stehen einmal pro Sektion.
	const layerHref = $derived(localizedHref('/layer/klima-pet-2022', locale));

	const SEVERITY_TEXT: Record<string, string> = {
		success: 'text-severity-success',
		'success-soft': 'text-severity-success-soft',
		neutral: 'text-ink',
		warning: 'text-severity-warning',
		danger: 'text-severity-danger'
	};
</script>

<section
	data-testid="klima-pet-card"
	class="border-b border-rule py-3"
	aria-label={m.inspector_klima_pet_aria_label({ layerName }, localeOpts)}
>
	<div class="flex items-start gap-2">
		<h4 class="min-w-0 flex-1 font-sans text-sm font-semibold text-ink">
			<a
				href={layerHref}
				data-testid="klima-pet-title-link"
				title={m.inspector_klima_pet_learn_more_aria({ layerName }, localeOpts)}
				class="inline-flex min-h-(--target-min) items-center underline-offset-2 hover:underline"
				>{layerName}</a
			>
		</h4>
		{#if addressPet !== null}
			<span
				data-testid="pet-address-value"
				class={`shrink-0 text-lg leading-none tabular-nums ${SEVERITY_TEXT[severity] ?? 'text-ink'}`}
			>
				{celsius(addressPet)}
			</span>
		{/if}
		{#if onToggleLayer}
			<button
				type="button"
				data-testid="map-toggle"
				aria-pressed={isActive}
				aria-label={isActive
					? m.inspector_klima_pet_map_toggle_remove({ layerName }, localeOpts)
					: m.inspector_klima_pet_map_toggle_add({ layerName }, localeOpts)}
				title={isActive
					? m.inspector_common_map_toggle_remove_title(undefined, localeOpts)
					: m.inspector_common_map_toggle_add_title(undefined, localeOpts)}
				onclick={() => onToggleLayer?.('klima-pet-2022')}
				class={`-my-1 inline-flex size-(--target-min) shrink-0 items-center justify-center rounded-sm hover:bg-bg ${isActive ? 'text-accent' : 'text-ink-subtle hover:text-ink'}`}
			>
				{#if isActive}<EyeOff size={14} aria-hidden="true" />{:else}<Eye
						size={14}
						aria-hidden="true"
					/>{/if}
			</button>
		{/if}
	</div>

	{#if afterTitle}
		{@render afterTitle()}
	{/if}

	{#if addressPet !== null && scale?.median != null && scale.min != null && scale.max != null}
		<div class="mt-2">
			<ScoreBar
				value={addressPet}
				min={scale.min}
				max={scale.max}
				anchorValue={scale.median}
				anchorLabel={m.inspector_score_bar_anchor_median(undefined, localeOpts)}
				valueLabel={m.inspector_score_bar_value_label(undefined, localeOpts)}
				unit="°C"
				{severity}
				layerName={m.inspector_klima_pet_kiez_context_label({ layerName }, localeOpts)}
			/>
		</div>
	{/if}

	{#if addressPet === null && contextRows.length > 0}
		<p data-testid="pet-no-point-value" class="mt-2 text-xs text-ink-subtle">
			{m.inspector_klima_pet_no_point_value(undefined, localeOpts)}
		</p>
	{/if}

	{#if contextRows.length > 0}
		<dl class="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-xs">
			{#each contextRows as row (row.id)}
				<dt class="truncate text-ink-muted">{row.label}</dt>
				<dd class="text-right text-ink tabular-nums">
					{celsius(row.agg.median as number)}
					<span class="ml-1 text-ink-subtle"
						>{fmt(row.agg.min as number)}–{fmt(row.agg.max as number)}</span
					>
				</dd>
			{/each}
		</dl>
	{/if}
</section>
