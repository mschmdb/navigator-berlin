<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import type { Snippet } from 'svelte';
	import { Eye, EyeOff } from '@lucide/svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { getLayerHitDisplay } from './internal/layer-hit-display.js';
	import { getValueSeverity, severityDescriptions } from './internal/value-severity-mapping.js';
	import { isOutdated } from './internal/source-shortener.js';
	import { getEditorialConfig } from '../internal/editorial-config.js';
	import MauerSektorenDetail from '../mauer-sektoren-detail.svelte';
	import ValueChip from '../value-chip.svelte';

	type Props = {
		hit: LayerHit;
		layerName: string;
		lang?: Locale;
		lat?: number;
		lng?: number;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
		/** GH-88: Score-Zugehörigkeit direkt unter dem Titel. */
		afterTitle?: Snippet;
	};

	let { hit, layerName, lang, isActive = false, onToggleLayer, afterTitle }: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	type RowState =
		| 'with-value'
		| 'no-coverage'
		| 'coverage-out-of-scope'
		| 'out-of-concept'
		| 'seasonal'
		| 'outdated';

	const display = $derived(getLayerHitDisplay(hit.layer, hit.value, localeOpts));
	const severity = $derived(getValueSeverity(hit.layer, hit.value));
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
		if (rowState === 'no-coverage') return m.inspector_layer_hit_no_coverage(undefined, localeOpts);
		if (rowState === 'coverage-out-of-scope')
			return m.inspector_layer_hit_coverage_out_of_scope(undefined, localeOpts);
		if (rowState === 'out-of-concept')
			return m.inspector_layer_hit_out_of_concept(undefined, localeOpts);
		if (rowState === 'seasonal') return m.inspector_layer_hit_seasonal(undefined, localeOpts);
		if (display.chip) {
			return display.chip.unit ? `${display.chip.value} ${display.chip.unit}` : display.chip.value;
		}
		if (display.fallbackText) return display.fallbackText;
		return m.inspector_layer_hit_no_coverage(undefined, localeOpts);
	});

	const groupLabel = $derived(`${layerName}: ${valueText}`);

	// GH-88: Der Titel führt zur Layer-Seite. Erklärung, Quelle, Stand und redaktionelle
	// Hinweise stehen einmal pro Sektion (SectionSources), nicht an jeder Zeile.
	const layerHref = $derived(localizedHref(`/layer/${hit.layer}`, locale));

	const showSeasonalActivePill = $derived(
		hit.layer === 'trinkbrunnen' && rowState === 'with-value'
	);
	const showSeasonalOutOfSeasonPill = $derived(
		hit.layer === 'trinkbrunnen' && rowState === 'seasonal'
	);

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
	class="flex flex-col gap-1 border-b border-rule py-3"
>
	<div class="flex items-start gap-2">
		<span class="min-w-0 flex-1 text-sm font-semibold text-ink" data-testid="layer-name">
			<a
				href={layerHref}
				title={m.inspector_layer_hit_learn_more_aria({ layerName }, localeOpts)}
				class="underline-offset-2 hover:underline">{layerName}</a
			>
		</span>
		<div
			class="flex shrink-0 flex-wrap items-center justify-end gap-1.5"
			data-testid="layer-hit-row-actions"
		>
			{#if rowState === 'with-value' && display.chip}
				<ValueChip
					{severity}
					value={display.chip.value}
					unit={display.chip.unit}
					numeric={display.chip.numeric}
					{layerName}
					compact
					severityDescriptions={severityDescriptions(localeOpts)}
				/>
			{:else if rowState === 'no-coverage'}
				<span class="text-sm text-ink-subtle" data-testid="value-no-coverage">
					{m.inspector_layer_hit_no_coverage(undefined, localeOpts)}
				</span>
			{:else if rowState === 'coverage-out-of-scope'}
				<span class="text-sm text-ink-subtle" data-testid="value-coverage-out-of-scope">
					{m.inspector_layer_hit_coverage_out_of_scope(undefined, localeOpts)}
				</span>
			{:else if rowState === 'out-of-concept'}
				<span class="text-sm text-ink-subtle" data-testid="value-out-of-concept">
					{m.inspector_layer_hit_out_of_concept(undefined, localeOpts)}
				</span>
			{:else if rowState === 'seasonal'}
				<span class="text-sm text-ink-muted" data-testid="value-seasonal">
					{m.inspector_layer_hit_seasonal(undefined, localeOpts)}
				</span>
			{/if}

			{#if showSeasonalActivePill}
				<span
					data-testid="seasonal-pill-active"
					class="inline-flex items-center rounded-sm bg-state-success/15 px-1.5 py-0.5 text-dense-meta font-semibold text-state-success"
				>
					{m.inspector_layer_hit_seasonal_active_pill(undefined, localeOpts)}
				</span>
			{:else if showSeasonalOutOfSeasonPill}
				<span
					data-testid="seasonal-pill-outofseason"
					class="inline-flex items-center rounded-sm bg-state-warning/15 px-1.5 py-0.5 text-dense-meta font-semibold text-state-warning"
				>
					{m.inspector_layer_hit_seasonal_outofseason_pill(undefined, localeOpts)}
				</span>
			{/if}

			{#if onToggleLayer}
				<button
					type="button"
					data-testid="map-toggle"
					data-state={isActive ? 'on' : 'off'}
					aria-pressed={isActive}
					aria-label={isActive
						? m.inspector_common_map_toggle_remove_named({ layerName }, localeOpts)
						: m.inspector_common_map_toggle_add_named({ layerName }, localeOpts)}
					title={isActive
						? m.inspector_common_map_toggle_remove_named({ layerName }, localeOpts)
						: m.inspector_common_map_toggle_add_named({ layerName }, localeOpts)}
					onclick={() => onToggleLayer?.(hit.layer)}
					class={[
						'-my-1 inline-flex size-(--target-min) items-center justify-center rounded-sm text-ink-subtle hover:bg-bg hover:text-ink',
						isActive && 'text-accent hover:text-accent-strong'
					]
						.filter(Boolean)
						.join(' ')}
				>
					{#if isActive}
						<EyeOff size={14} aria-hidden="true" />
					{:else}
						<Eye size={14} aria-hidden="true" />
					{/if}
				</button>
			{/if}
		</div>
	</div>

	{#if afterTitle}
		{@render afterTitle()}
	{/if}

	{#if rowState === 'with-value' && !display.chip && display.fallbackText}
		<p class="text-sm font-medium text-ink" data-testid="value">{display.fallbackText}</p>
	{/if}

	{#if display.context}
		<p class="text-xs text-ink-muted" data-testid="row-context">{display.context}</p>
	{/if}

	{#if showMauerDetail}
		<MauerSektorenDetail
			fetchedAt={hit.updatedAt}
			historicalNoteLabel={m.inspector_mauer_historical_note(undefined, localeOpts)}
			memorialLinkLabel={m.inspector_mauer_memorial_link(undefined, localeOpts)}
			sourcePrefixLabel={m.inspector_mauer_source_prefix(undefined, localeOpts)}
			sourceLabel={m.inspector_mauer_source_label(undefined, localeOpts)}
			standLabel={m.inspector_mauer_stand_label(undefined, localeOpts)}
		/>
	{/if}
</div>
