<script lang="ts">
	import { ArcChart, Tooltip } from 'layerchart';
	import { DIMENSION_LABELS_DE, scaleFor } from '../inspector-panel/internal/kiez-score-display.js';
	import { severityColor } from './internal/chart-palette.js';
	import { COMPOSITE_DIMENSIONS } from '$lib/data';
	import type { KiezScore, KiezScoreDimension } from '$lib/data';

	type Props = {
		score: KiezScore;
		layerName?: string;
		/** Klick auf ein Ring-Segment. Konsument klappt die zugehörige Detail-Row auf. */
		onSegmentClick?: (dimension: KiezScoreDimension) => void;
	};

	let { score, layerName = 'Kiez-Score', onSegmentClick }: Props = $props();

	// Story 14.4: Der Ring visualisiert exakt den Composite (GESAMT = Mittel der fünf). Kultur und
	// Kriminalität sind Kontext-Dimensionen (nicht im Composite) und erscheinen NICHT als Ring-Segment:
	// Der Ring ist Gut-Grün ("höher = besser"), Kriminalität (Magnitude/Indigo) würde dort als positiver
	// Bogen fehlgelesen (Stigma, ADR-019). Beide stehen als Zeilen unter dem Ring.
	const RING_DIMENSIONS: readonly KiezScoreDimension[] = COMPOSITE_DIMENSIONS;

	interface ArcDatum {
		key: KiezScoreDimension;
		label: string;
		value: number;
		scoreText: string;
	}

	function dimValue(dim: KiezScoreDimension): number | null {
		return score.dimensions.find((d) => d.dimension === dim)?.value ?? null;
	}

	// Konzentrische Activity-Ringe: ein Ring pro Dimension, Füllung = Score/100,
	// Farbe = Severity-Stufe. Aussen → innen in Dimensions-Reihenfolge.
	const arcSeries = $derived(
		RING_DIMENSIONS.map((dim) => {
			const value = dimValue(dim);
			const scale = scaleFor(value, dim);
			const datum: ArcDatum = {
				key: dim,
				label: DIMENSION_LABELS_DE[dim],
				value: value ?? 0,
				scoreText: value !== null ? `${Math.round(value)} / 100` : 'keine Daten'
			};
			return {
				key: dim,
				label: DIMENSION_LABELS_DE[dim],
				maxValue: 100,
				color: value !== null && scale ? severityColor(scale.severity) : 'var(--rule, #ddd)',
				data: [datum]
			};
		})
	);

	const scoreByDim = $derived(new Map(arcSeries.map((s) => [s.key as string, s.data[0]])));

	const overallText = $derived(
		score.overall !== undefined ? String(Math.round(score.overall)) : '—'
	);

	function handleArcClick(_e: MouseEvent, detail: { data: unknown }): void {
		const d = detail.data as ArcDatum | undefined;
		if (d?.key) onSegmentClick?.(d.key);
	}

	// grid/axis/rule sind aus ArcChartProps geomittet, erreichen die kartesische Chart-Basis
	// aber via restProps. Cast, um die radialen Gitter-/Achsen-Linien abzuschalten.
	const noCartesianChrome = { grid: false, axis: false, rule: false } as Record<string, unknown>;
</script>

<div data-testid="kiez-score-ring" class="flex flex-col items-center">
	<div class="relative aspect-square w-[236px] overflow-hidden">
		<ArcChart
			key="key"
			label="label"
			value="value"
			series={arcSeries}
			innerRadius={-10}
			outerRadius={-12}
			cornerRadius={4}
			props={{ arc: { motion: 'spring' } }}
			labels={{
				placement: 'middle',
				startOffset: '0%',
				value: 'label',
				class: 'fill-white font-sans text-[8px] font-medium pointer-events-none'
			}}
			onArcClick={handleArcClick}
			{...noCartesianChrome}
		>
			{#snippet tooltip({ context })}
				{@const hovered = context.tooltip.series.filter((s) => s.value !== undefined)}
				{#if hovered.length > 0}
					<Tooltip.Root>
						{#each hovered as s (s.key)}
							{@const datum = scoreByDim.get(String(s.key))}
							<Tooltip.Header value={datum?.label ?? String(s.label ?? '')} />
							<Tooltip.List>
								<Tooltip.Item label="Score" value={datum?.scoreText ?? '—'} />
							</Tooltip.List>
						{/each}
					</Tooltip.Root>
				{/if}
			{/snippet}
		</ArcChart>
		<div
			class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
			aria-hidden="true"
		>
			<span class="font-mono text-[11px] tracking-wide text-ink-subtle uppercase">Gesamt</span>
			<span class="font-mono text-4xl leading-none font-semibold text-ink">{overallText}</span>
			<span class="font-mono text-[10px] text-ink-subtle">/ 100</span>
		</div>
	</div>

	<table class="sr-only" data-testid="kiez-score-ring-table">
		<caption>{layerName}</caption>
		<tbody>
			<tr>
				<th scope="row">Gesamt</th>
				<td>{overallText} / 100</td>
			</tr>
			{#each arcSeries as s (s.key)}
				<tr>
					<th scope="row">{s.label}</th>
					<td>{s.data[0].scoreText}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
