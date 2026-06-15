<script lang="ts">
	import type { SeverityLevel } from '../inspector-panel/internal/value-severity-mapping.js';
	import { proximityFraction, ringDashArray } from './internal/chart-scale.js';
	import { severityColor } from './internal/chart-palette.js';

	type Props = {
		/** Distanz zum nächsten POI in Metern; null = keine Daten. */
		distanceMeters: number | null;
		label: string;
		layerName?: string;
		maxMeters?: number;
		countInPolygon?: number | null;
		severity?: SeverityLevel;
	};

	let {
		distanceMeters,
		label,
		layerName,
		maxMeters = 1000,
		countInPolygon = null,
		severity = 'neutral'
	}: Props = $props();

	const RADIUS = 18;
	const CIRC = 2 * Math.PI * RADIUS;

	const fraction = $derived(
		distanceMeters !== null && Number.isFinite(distanceMeters)
			? proximityFraction(distanceMeters, maxMeters)
			: 0
	);
	const dash = $derived(ringDashArray(fraction, CIRC));
	const strokeColor = $derived(severityColor(severity));
	const name = $derived(layerName ?? label);

	function formatDistance(m: number | null): string {
		if (m === null || !Number.isFinite(m)) return 'k. A.';
		if (m < 1000) return `${Math.round(m)} m`;
		return `${(m / 1000).toFixed(1)} km`;
	}
	const distanceText = $derived(formatDistance(distanceMeters));
</script>

<div data-testid="distance-ring" data-severity={severity} class="flex items-center gap-3">
	<svg
		width="48"
		height="48"
		viewBox="0 0 48 48"
		role="img"
		aria-label={`${name}: nächste Distanz ${distanceText}`}
		class="shrink-0"
	>
		<circle
			cx="24"
			cy="24"
			r={RADIUS}
			fill="none"
			stroke="var(--bg-muted, #eee)"
			stroke-width="4"
		/>
		<circle
			data-testid="distance-ring-arc"
			cx="24"
			cy="24"
			r={RADIUS}
			fill="none"
			stroke={strokeColor}
			stroke-width="4"
			stroke-linecap="round"
			stroke-dasharray={dash}
			transform="rotate(-90 24 24)"
		/>
		<text
			x="24"
			y="27"
			text-anchor="middle"
			class="fill-ink font-mono text-[9px]"
			aria-hidden="true">{distanceText}</text
		>
	</svg>
	<div class="min-w-0">
		<p class="font-sans text-sm text-ink">{label}</p>
		{#if countInPolygon !== null}
			<p data-testid="distance-ring-count" class="font-mono text-xs text-ink-subtle">
				{countInPolygon} im Gebiet
			</p>
		{/if}
	</div>

	<table class="sr-only" data-testid="distance-ring-table">
		<caption>{name}</caption>
		<tbody>
			<tr>
				<th scope="row">Nächste Distanz</th>
				<td>{distanceText}</td>
			</tr>
			{#if countInPolygon !== null}
				<tr>
					<th scope="row">Anzahl im Gebiet</th>
					<td>{countInPolygon}</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
