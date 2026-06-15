<script lang="ts">
	import { ArrowUp, Minus } from '@lucide/svelte';
	import type { LayerHit } from '$lib/data';
	import { getLayerHitDisplay } from '../inspector-panel/internal/layer-hit-display.js';
	import {
		getValueSeverity,
		type SeverityLevel
	} from '../inspector-panel/internal/value-severity-mapping.js';
	import {
		compareLayerValues,
		getCompareProfile,
		type CompareProfile,
		type CompareResult
	} from '$lib/utils/layer-compare.js';
	import ValueChip from '../value-chip.svelte';

	type Props = {
		slug: string;
		layerName: string;
		hitA: LayerHit | null;
		hitB: LayerHit | null;
	};

	let { slug, layerName, hitA, hitB }: Props = $props();

	// Mietspiegel/Wohnlage sind keine Wohnqualität (Editorial-Würde): kein severity-color-coding im Compare.
	const NEUTRAL_CHIP_SLUGS = new Set(['mietspiegel-wohnlage', 'wohnlagen-2024']);
	// Bewertbare Profile zeigen Diff-Pfeil + Equal-Minus. Neutrale/no-judgment Profile zeigen keinen Indikator.
	const EVALUATIVE_PROFILES = new Set<CompareProfile>([
		'numeric-lower-better',
		'ordinal-higher-better',
		'ordinal-lower-better',
		'presence-neutral-positive',
		'distance-lower-better'
	]);

	const compareResult: CompareResult = $derived(
		compareLayerValues(slug, hitA?.value ?? null, hitB?.value ?? null)
	);
	const profile = $derived(getCompareProfile(slug));
	const isEvaluative = $derived(EVALUATIVE_PROFILES.has(profile));

	const displayA = $derived(hitA ? getLayerHitDisplay(slug, hitA.value) : null);
	const displayB = $derived(hitB ? getLayerHitDisplay(slug, hitB.value) : null);

	function chipSeverity(value: unknown): SeverityLevel {
		if (NEUTRAL_CHIP_SLUGS.has(slug)) return 'neutral';
		return getValueSeverity(slug, value);
	}
	const severityA = $derived(hitA ? chipSeverity(hitA.value) : null);
	const severityB = $derived(hitB ? chipSeverity(hitB.value) : null);

	const ariaLabelA = $derived.by(() => {
		if (compareResult.direction === 'a-better') return `Adresse A ist günstiger bei ${layerName}`;
		if (compareResult.direction === 'b-better') return `Adresse A ist ungünstiger bei ${layerName}`;
		if (compareResult.direction === 'equal') return `Adresse A und B gleich bei ${layerName}`;
		return `${layerName}, Vergleich nicht möglich`;
	});
	const ariaLabelB = $derived.by(() => {
		if (compareResult.direction === 'b-better') return `Adresse B ist günstiger bei ${layerName}`;
		if (compareResult.direction === 'a-better') return `Adresse B ist ungünstiger bei ${layerName}`;
		if (compareResult.direction === 'equal') return `Adresse A und B gleich bei ${layerName}`;
		return `${layerName}, Vergleich nicht möglich`;
	});
</script>

<tr
	data-testid="compare-row"
	data-slug={slug}
	data-direction={compareResult.direction}
	class="border-b border-rule"
>
	<th scope="row" class="py-2 pr-3 text-left align-top font-sans text-sm text-ink">
		{layerName}
	</th>
	<td class="py-2 pr-3 align-top">
		{#if displayA?.chip && severityA}
			<span role="group" class="inline-flex items-center gap-1.5" aria-label={ariaLabelA}>
				<ValueChip
					severity={severityA}
					value={displayA.chip.value}
					unit={displayA.chip.unit}
					numeric={displayA.chip.numeric}
					{layerName}
				/>
				{#if isEvaluative && compareResult.direction === 'a-better'}
					<ArrowUp
						size={14}
						color="var(--color-severity-success, currentColor)"
						data-testid="diff-arrow-a"
						aria-hidden="true"
					/>
				{:else if isEvaluative && compareResult.direction === 'equal'}
					<Minus
						size={14}
						color="var(--color-severity-neutral, currentColor)"
						data-testid="diff-equal-a"
						aria-hidden="true"
					/>
				{/if}
			</span>
			{#if displayA.context}
				<div class="mt-0.5 font-mono text-xs text-ink-subtle">{displayA.context}</div>
			{/if}
		{:else if displayA?.fallbackText}
			<span class="font-mono text-sm text-ink">{displayA.fallbackText}</span>
			{#if displayA.context}
				<div class="mt-0.5 font-mono text-xs text-ink-subtle">{displayA.context}</div>
			{/if}
		{:else}
			<span role="img" class="font-mono text-sm text-ink-subtle" aria-label="Keine Daten verfügbar"
				>–</span
			>
		{/if}
	</td>
	<td class="py-2 align-top">
		{#if displayB?.chip && severityB}
			<span role="group" class="inline-flex items-center gap-1.5" aria-label={ariaLabelB}>
				<ValueChip
					severity={severityB}
					value={displayB.chip.value}
					unit={displayB.chip.unit}
					numeric={displayB.chip.numeric}
					{layerName}
				/>
				{#if isEvaluative && compareResult.direction === 'b-better'}
					<ArrowUp
						size={14}
						color="var(--color-severity-success, currentColor)"
						data-testid="diff-arrow-b"
						aria-hidden="true"
					/>
				{/if}
			</span>
			{#if displayB.context}
				<div class="mt-0.5 font-mono text-xs text-ink-subtle">{displayB.context}</div>
			{/if}
		{:else if displayB?.fallbackText}
			<span class="font-mono text-sm text-ink">{displayB.fallbackText}</span>
			{#if displayB.context}
				<div class="mt-0.5 font-mono text-xs text-ink-subtle">{displayB.context}</div>
			{/if}
		{:else}
			<span role="img" class="font-mono text-sm text-ink-subtle" aria-label="Keine Daten verfügbar"
				>–</span
			>
		{/if}
	</td>
</tr>
{#if compareResult.deltaLabel || compareResult.advisory}
	<tr data-testid="compare-row-delta" data-slug={slug}>
		<td colspan="3" class="pt-0 pb-2 pl-3">
			{#if compareResult.deltaLabel}
				<span class="font-mono text-xs text-ink-muted" data-testid="compare-delta-label">
					{compareResult.deltaLabel}
				</span>
			{/if}
			{#if compareResult.advisory}
				<span class="ml-2 font-serif text-xs text-ink-subtle italic" data-testid="compare-advisory">
					{compareResult.advisory}
				</span>
			{/if}
		</td>
	</tr>
{/if}
