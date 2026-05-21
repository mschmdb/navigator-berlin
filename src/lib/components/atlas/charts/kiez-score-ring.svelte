<script lang="ts">
	import {
		DIMENSION_LABELS_DE,
		scaleFor,
		scaleForOverall
	} from '../inspector-panel/internal/kiez-score-display.js';
	import { severityColor } from './internal/chart-palette.js';
	import type { KiezScore, KiezScoreDimension } from '$lib/data';

	type Props = {
		score: KiezScore;
		layerName?: string;
	};

	let { score, layerName = 'Kiez-Score' }: Props = $props();

	const KIEZ_SCORE_DIMENSIONS: readonly KiezScoreDimension[] = [
		'ruhe-luft',
		'gruen',
		'mobilitaet',
		'soziale-lage',
		'versorgung'
	];

	const RADIUS = 20;
	const CIRC = 2 * Math.PI * RADIUS;
	const SEG = CIRC / KIEZ_SCORE_DIMENSIONS.length;
	const GAP = 4;
	const ARC = SEG - GAP;

	function dimValue(dim: KiezScoreDimension): number | null {
		return score.dimensions.find((d) => d.dimension === dim)?.value ?? null;
	}

	const segments = $derived(
		KIEZ_SCORE_DIMENSIONS.map((dim, i) => {
			const value = dimValue(dim);
			const scale = scaleFor(value, dim);
			return {
				dim,
				label: DIMENSION_LABELS_DE[dim],
				value,
				color: value !== null && scale ? severityColor(scale.severity) : 'var(--bg-muted, #eee)',
				dashoffset: -(i * SEG)
			};
		})
	);

	const overallScale = $derived(scaleForOverall(score.overall));
	const overallText = $derived(score.overall !== undefined ? String(Math.round(score.overall)) : '—');
</script>

<div data-testid="kiez-score-ring" class="flex flex-col items-center">
	<svg
		width="112"
		height="112"
		viewBox="0 0 56 56"
		role="img"
		aria-label={`${layerName} gesamt ${overallText} von 100`}
	>
		{#each segments as seg (seg.dim)}
			<circle
				data-testid={`ring-segment-${seg.dim}`}
				cx="28"
				cy="28"
				r={RADIUS}
				fill="none"
				stroke={seg.color}
				stroke-width="6"
				stroke-dasharray={`${ARC} ${CIRC - ARC}`}
				stroke-dashoffset={seg.dashoffset}
				transform="rotate(-90 28 28)"
			/>
		{/each}
		<text
			x="28"
			y="27"
			text-anchor="middle"
			class="fill-ink font-mono text-[11px] font-semibold"
			aria-hidden="true">{overallText}</text
		>
		<text
			x="28"
			y="35"
			text-anchor="middle"
			class="fill-ink-subtle font-mono text-[5px]"
			aria-hidden="true">/ 100</text
		>
	</svg>
	{#if overallScale}
		<span data-testid="ring-overall-label" class="mt-1 font-sans text-sm font-semibold text-ink">
			{overallScale.label}
		</span>
	{/if}

	<table class="sr-only" data-testid="kiez-score-ring-table">
		<caption>{layerName}</caption>
		<tbody>
			<tr>
				<th scope="row">Gesamt</th>
				<td>{overallText} / 100</td>
			</tr>
			{#each segments as seg (seg.dim)}
				<tr>
					<th scope="row">{seg.label}</th>
					<td>{seg.value !== null ? `${Math.round(seg.value)} / 100` : 'keine Daten'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
