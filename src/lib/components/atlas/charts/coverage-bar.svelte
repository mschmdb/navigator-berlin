<script lang="ts">
	import type { SeverityLevel } from '../inspector-panel/internal/value-severity-mapping.js';
	import { barPercent } from './internal/chart-scale.js';
	import { severityColor } from './internal/chart-palette.js';

	type Props = {
		/** Flächenanteil 0-100. */
		share: number;
		label: string;
		layerName?: string;
		severity?: SeverityLevel;
	};

	let { share, label, layerName, severity = 'neutral' }: Props = $props();

	const fillPct = $derived(barPercent(share, 0, 100));
	const fillColor = $derived(severityColor(severity));
	const rounded = $derived(Math.round(fillPct));
	const name = $derived(layerName ?? label);
</script>

<div data-testid="coverage-bar" data-severity={severity} class="w-full">
	<div class="mb-1 flex items-baseline justify-between gap-2">
		<span class="font-sans text-sm text-ink">{label}</span>
		<span data-testid="coverage-bar-value" class="font-mono text-sm tabular-nums text-ink"
			>{rounded}%</span
		>
	</div>
	<div
		class="h-2.5 w-full overflow-hidden rounded-full bg-bg-muted"
		role="img"
		aria-label={`${name}: ${rounded} Prozent Flächenanteil`}
	>
		<div
			data-testid="coverage-bar-fill"
			class="h-full rounded-full"
			style:width={`${fillPct}%`}
			style:background-color={fillColor}
		></div>
	</div>

	<table class="sr-only" data-testid="coverage-bar-table">
		<caption>{name}</caption>
		<tbody>
			<tr>
				<th scope="row">{label}</th>
				<td>{rounded}%</td>
			</tr>
		</tbody>
	</table>
</div>
