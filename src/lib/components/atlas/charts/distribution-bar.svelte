<script lang="ts" module>
	import type { SeverityLevel } from '../inspector-panel/internal/value-severity-mapping.js';

	export interface DistributionClass {
		label: string;
		share: number;
		severity?: SeverityLevel;
	}
</script>

<script lang="ts">
	import { cumulativeSegments } from './internal/chart-scale.js';
	import { severityColor, categoricalColor, NEUTRAL_COLOR } from './internal/chart-palette.js';

	type Props = {
		classes: readonly DistributionClass[];
		layerName: string;
		dominant?: string;
		/** Stigma-Layer: keine Severity-Wertung, neutrale kategorische Palette. */
		neutral?: boolean;
	};

	let { classes, layerName, dominant, neutral = false }: Props = $props();

	const segments = $derived(cumulativeSegments(classes));

	function colorFor(cls: DistributionClass, index: number): string {
		if (neutral) return categoricalColor(index);
		return cls.severity ? severityColor(cls.severity) : NEUTRAL_COLOR;
	}

	const dominantLabel = $derived(
		dominant ?? classes.reduce((a, b) => (b.share > a.share ? b : a), classes[0])?.label ?? ''
	);
	const totalShare = $derived(classes.reduce((s, c) => s + Math.max(0, c.share), 0));
	function pct(share: number): string {
		return totalShare > 0 ? `${Math.round((Math.max(0, share) / totalShare) * 100)}%` : '0%';
	}
</script>

<div data-testid="distribution-bar" data-neutral={neutral} class="w-full">
	{#if dominantLabel}
		<p data-testid="distribution-dominant" class="mb-1 font-sans text-sm font-semibold text-ink">
			{dominantLabel}
		</p>
	{/if}
	<div
		class="bg-bg-muted flex h-2.5 w-full overflow-hidden rounded-full"
		role="img"
		aria-label={`${layerName}: Verteilung, dominant ${dominantLabel}`}
	>
		{#each classes as cls, i (cls.label)}
			{@const seg = segments[i]}
			<div
				data-testid={`distribution-segment-${i}`}
				class="h-full"
				style:width={`${seg?.widthPct ?? 0}%`}
				style:background-color={colorFor(cls, i)}
				title={`${cls.label}: ${pct(cls.share)}`}
			></div>
		{/each}
	</div>

	<table class="sr-only" data-testid="distribution-bar-table">
		<caption>{layerName}</caption>
		<thead>
			<tr>
				<th scope="col">Klasse</th>
				<th scope="col">Anteil</th>
			</tr>
		</thead>
		<tbody>
			{#each classes as cls (cls.label)}
				<tr>
					<th scope="row">{cls.label}</th>
					<td>{pct(cls.share)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
