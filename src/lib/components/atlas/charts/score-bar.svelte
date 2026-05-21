<script lang="ts">
	import type { SeverityLevel } from '../inspector-panel/internal/value-severity-mapping.js';
	import { barPercent } from './internal/chart-scale.js';
	import { severityColor } from './internal/chart-palette.js';

	type Props = {
		value: number;
		layerName: string;
		min?: number;
		max?: number;
		anchorValue?: number | null;
		anchorLabel?: string;
		unit?: string;
		severity?: SeverityLevel;
	};

	let {
		value,
		layerName,
		min = 0,
		max = 100,
		anchorValue = null,
		anchorLabel = 'Median',
		unit = '',
		severity = 'neutral'
	}: Props = $props();

	const fillPct = $derived(barPercent(value, min, max));
	const anchorPct = $derived(
		anchorValue !== null && Number.isFinite(anchorValue) ? barPercent(anchorValue, min, max) : null
	);
	const fillColor = $derived(severityColor(severity));
	const unitSuffix = $derived(unit ? ` ${unit}` : '');
</script>

<div data-testid="score-bar" data-severity={severity} class="w-full">
	<div
		class="relative h-2.5 w-full overflow-hidden rounded-full bg-bg-muted"
		role="img"
		aria-label={`${layerName}: ${value}${unitSuffix}${anchorPct !== null ? `, ${anchorLabel} ${anchorValue}${unitSuffix}` : ''}`}
	>
		<div
			data-testid="score-bar-fill"
			class="h-full rounded-full"
			style:width={`${fillPct}%`}
			style:background-color={fillColor}
		></div>
		{#if anchorPct !== null}
			<div
				data-testid="score-bar-anchor"
				class="absolute top-0 h-full w-px bg-ink"
				style:left={`${anchorPct}%`}
				title={`${anchorLabel}: ${anchorValue}${unitSuffix}`}
			></div>
		{/if}
	</div>

	<table class="sr-only" data-testid="score-bar-table">
		<caption>{layerName}</caption>
		<tbody>
			<tr>
				<th scope="row">Wert</th>
				<td>{value}{unitSuffix}</td>
			</tr>
			{#if anchorPct !== null}
				<tr>
					<th scope="row">{anchorLabel}</th>
					<td>{anchorValue}{unitSuffix}</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
