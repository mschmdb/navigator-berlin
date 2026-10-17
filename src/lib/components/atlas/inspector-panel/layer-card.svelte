<script lang="ts" module>
	export type { ContextRow } from './internal/context-rows.js';
</script>

<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import type { Snippet } from 'svelte';
	import { Eye, EyeOff } from '@lucide/svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { getLayerHitDisplay } from './internal/layer-hit-display.js';
	import { glueShare } from './internal/context-rows.js';
	import { getValueSeverity, severityDescriptions } from './internal/value-severity-mapping.js';
	import type { ContextRow } from './internal/context-rows.js';
	import type { SeverityLevel } from './internal/value-severity-mapping.js';
	import ValueChip from '../value-chip.svelte';

	// GH-88: Stufenpunkt in den Umfeld-Zeilen; statische Klassen, damit Tailwind sie findet.
	const DOT_CLASS: Record<SeverityLevel, string> = {
		success: 'bg-severity-success',
		'success-soft': 'bg-severity-success-soft',
		neutral: 'bg-severity-neutral',
		warning: 'bg-severity-warning',
		danger: 'bg-severity-danger'
	};

	type Props = {
		hit: LayerHit;
		layerName: string;
		lang?: Locale;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
		/** Vom Parent vorgebaute Umfeld-Zeilen (Kiez/Bezirk/Berlin), aggregat-typ-agnostisch. */
		contextRows?: readonly ContextRow[];
		/** GH-88: Score-Zugehörigkeit direkt unter dem Titel (Nähe statt Label über der Karte). */
		afterTitle?: Snippet;
	};

	let {
		hit,
		layerName,
		lang,
		isActive = false,
		onToggleLayer,
		contextRows = [],
		afterTitle
	}: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	const display = $derived(getLayerHitDisplay(hit.layer, hit.value, localeOpts));
	const severity = $derived(getValueSeverity(hit.layer, hit.value));
	// GH-88: Der Titel führt zur Layer-Seite, Quelle und Details stehen einmal pro Sektion.
	const layerHref = $derived(localizedHref(`/layer/${hit.layer}`, locale));

	type RowState =
		| 'with-value'
		| 'no-coverage'
		| 'coverage-out-of-scope'
		| 'out-of-concept'
		| 'seasonal';
	const rowState: RowState = $derived.by(() => {
		if (hit.reason === 'coverage-out-of-scope') return 'coverage-out-of-scope';
		if (hit.reason === 'out-of-concept') return 'out-of-concept';
		if (hit.reason === 'no-coverage') return 'no-coverage';
		if (hit.reason === 'seasonal') return 'seasonal';
		return 'with-value';
	});
	const stateText = $derived.by(() => {
		switch (rowState) {
			case 'no-coverage':
				return m.inspector_layer_card_no_coverage(undefined, localeOpts);
			case 'coverage-out-of-scope':
				return m.inspector_layer_card_coverage_out_of_scope(undefined, localeOpts);
			case 'out-of-concept':
				return m.inspector_layer_card_out_of_concept(undefined, localeOpts);
			case 'seasonal':
				return m.inspector_layer_card_seasonal(undefined, localeOpts);
			default:
				return null;
		}
	});
	// POI-Layer liefern den Namen als fallbackText (kein Severity-Chip). Den zeigen wir
	// prominent unter dem Layer-Titel statt klein-kursiv im Header.
	const poiName = $derived(
		rowState === 'with-value' && !display.chip ? display.fallbackText : null
	);
</script>

<section
	data-testid="layer-card"
	data-layer={hit.layer}
	class="border-b border-rule py-3"
	aria-label={m.inspector_layer_card_aria_label({ layerName }, localeOpts)}
>
	<div class="flex items-center gap-2">
		<h4 class="min-w-0 flex-1 font-sans text-sm font-semibold text-ink">
			<a
				href={layerHref}
				data-testid="layer-card-title-link"
				title={m.inspector_layer_card_learn_more_aria({ layerName }, localeOpts)}
				class="inline-flex min-h-(--target-min) items-center underline-offset-2 hover:underline"
				>{layerName}</a
			>
		</h4>
		{#if rowState === 'with-value' && display.chip}
			<div class="flex shrink-0 items-center">
				<ValueChip
					{severity}
					value={display.chip.value}
					unit={display.chip.unit}
					numeric={display.chip.numeric}
					{layerName}
					compact
					severityDescriptions={severityDescriptions(localeOpts)}
				/>
			</div>
		{/if}
		{#if onToggleLayer}
			<button
				type="button"
				data-testid="map-toggle"
				aria-pressed={isActive}
				aria-label={isActive
					? m.inspector_common_map_toggle_remove_named({ layerName }, localeOpts)
					: m.inspector_common_map_toggle_add_named({ layerName }, localeOpts)}
				title={isActive
					? m.inspector_common_map_toggle_remove_title(undefined, localeOpts)
					: m.inspector_common_map_toggle_add_title(undefined, localeOpts)}
				onclick={() => onToggleLayer?.(hit.layer)}
				class={`inline-flex size-(--target-min) shrink-0 items-center justify-center rounded-sm hover:bg-bg ${isActive ? 'text-accent' : 'text-ink-subtle hover:text-ink'}`}
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

	<!-- GH-88 Review: Fehltexte unter dem Titel über die volle Breite, damit der Titel auf
	     schmalen Ansichten nicht zusammengedrückt wird. -->
	{#if !(rowState === 'with-value' && display.chip)}
		{#if stateText}
			<p class="text-sm text-ink-subtle">{stateText}</p>
		{:else if !poiName}
			<p class="text-sm text-ink-subtle">{m.inspector_layer_card_no_data(undefined, localeOpts)}</p>
		{/if}
	{/if}

	{#if poiName}
		<p data-testid="poi-value" class="mt-0.5 font-sans text-sm font-medium text-ink">
			{poiName}
		</p>
	{/if}

	{#if display.context}
		<p class="mt-1 font-sans text-xs text-ink-muted">{display.context}</p>
	{/if}

	{#if contextRows.length > 0}
		<!-- Label hat eine Mindestbreite, der Wert nimmt seine volle Breite und bricht nur
		     als letzter Ausweg um. Kein nowrap: das Panel schneidet horizontal ab. -->
		<dl class="mt-2 grid grid-cols-[minmax(7rem,1fr)_auto] gap-x-3 gap-y-0.5 text-xs">
			{#each contextRows as row (row.id)}
				<dt class="break-words text-ink-muted">{row.label}</dt>
				<dd class="text-right text-ink tabular-nums">
					{#if row.severity}<span
							data-testid="context-severity-dot"
							data-severity={row.severity}
							aria-hidden="true"
							class="mr-1.5 inline-block size-2 rounded-full align-middle {DOT_CLASS[row.severity]}"
						></span>{/if}{glueShare(row.text)}
				</dd>
			{/each}
		</dl>
	{/if}
</section>
