<script lang="ts" module>
	export type ClimateMetric = 'summer' | 'frost' | 'hot';
</script>

<script lang="ts">
	import type { YearValue } from '$lib/data';
	import AccessibleChart, {
		type ChartScales,
		type YearPoint
	} from './accessible-chart.svelte';
	import { linearRegression } from '$lib/utils/regression.js';

	type Props = {
		series: readonly YearValue[];
		metric: ClimateMetric;
		stationName: string;
		unit?: string;
	};

	let { series, metric, stationName, unit = 'Tage/Jahr' }: Props = $props();

	const TITLES: Record<ClimateMetric, string> = {
		summer: 'Sommertage (T_max ≥ 25°C)',
		frost: 'Frosttage (T_min < 0°C)',
		hot: 'Heiße Tage (T_max ≥ 30°C)'
	};

	const SHORT_LABELS: Record<ClimateMetric, string> = {
		summer: 'Sommertage',
		frost: 'Frosttage',
		hot: 'Heiße Tage'
	};

	const points = $derived<YearPoint[]>(
		series.map((d) => ({ year: d.year, value: d.count ?? 0 }))
	);

	const stats = $derived.by(() => {
		if (points.length === 0) {
			return { min: 0, max: 0, latest: 0, latestYear: 0, first: 0, firstYear: 0, avg: 0 };
		}
		const values = points.map((p) => p.value);
		const sum = values.reduce((a, b) => a + b, 0);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const latest = points[points.length - 1]!.value;
		const latestYear = points[points.length - 1]!.year;
		const first = points[0]!.value;
		const firstYear = points[0]!.year;
		const avg = sum / values.length;
		return { min, max, latest, latestYear, first, firstYear, avg };
	});

	const trend = $derived.by(() => {
		if (points.length < 2) return null;
		const fit = linearRegression(
			points,
			(p) => p.year,
			(p) => p.value
		);
		const xa = points[0]!.year;
		const xb = points[points.length - 1]!.year;
		return {
			direction: fit.slope > 0.05 ? 'steigend' : fit.slope < -0.05 ? 'fallend' : 'stabil',
			predictA: fit.predict(xa),
			predictB: fit.predict(xb),
			xa,
			xb
		};
	});

	const description = $derived(
		points.length === 0
			? `Keine Daten für ${SHORT_LABELS[metric]} an DWD-Station ${stationName}.`
			: `Sparkline ${SHORT_LABELS[metric]} pro Jahr seit ${stats.firstYear} für DWD-Station ${stationName}. Aktueller Wert ${stats.latest} ${unit}, Mittelwert ${stats.avg.toFixed(1)}, Trend ${trend?.direction ?? 'unbekannt'}.`
	);

	const figcaption = $derived(
		points.length === 0
			? `Keine Daten verfügbar.`
			: `Min: ${stats.min} · Max: ${stats.max} · Latest: ${stats.latest} ${unit}`
	);

	const chartId = $derived(
		`sparkline-${metric}-${stationName.replace(/\W+/g, '-').toLowerCase()}`
	);

	function pathFor(scales: ChartScales): string {
		if (points.length === 0) return '';
		const { xScale, yScale } = scales;
		return points
			.map(
				(p, i) =>
					`${i === 0 ? 'M' : 'L'} ${xScale(p.year).toFixed(2)} ${yScale(p.value).toFixed(2)}`
			)
			.join(' ');
	}

	function trendPath(scales: ChartScales): string {
		if (!trend) return '';
		const { xScale, yScale } = scales;
		return `M ${xScale(trend.xa).toFixed(2)} ${yScale(trend.predictA).toFixed(2)} L ${xScale(trend.xb).toFixed(2)} ${yScale(trend.predictB).toFixed(2)}`;
	}
</script>

<div class="climate-sparkline" data-testid="climate-sparkline" data-metric={metric}>
	<h4
		class="mb-1 font-serif text-sm text-ink"
		data-testid="climate-sparkline-heading"
	>
		{SHORT_LABELS[metric]}
	</h4>
	<AccessibleChart
		{chartId}
		title={TITLES[metric]}
		{description}
		series={points}
		{figcaption}
		width={320}
		height={90}
		padding={{ top: 14, right: 36, bottom: 16, left: 8 }}
		tableCaption={`${SHORT_LABELS[metric]} bei ${stationName}`}
		tableValueLabel={unit}
	>
		{#snippet children(scales)}
			{@const linePath = pathFor(scales)}
			{@const tPath = trendPath(scales)}
			{#if tPath}
				<path
					d={tPath}
					data-testid="sparkline-trend"
					stroke="var(--chart-line-secondary, currentColor)"
					stroke-width="1"
					stroke-dasharray="2 2"
					fill="none"
					opacity="0.7"
				/>
			{/if}
			{#if linePath}
				<path
					d={linePath}
					data-testid="sparkline-line"
					stroke="var(--chart-line, currentColor)"
					stroke-width="1.5"
					fill="none"
				/>
			{/if}
			{#if points.length > 0}
				{@const last = points[points.length - 1]}
				{@const lx = scales.xScale(last.year)}
				{@const ly = scales.yScale(last.value)}
				<circle cx={lx} cy={ly} r="2.5" fill="var(--chart-line, currentColor)" />
				<text
					x={lx - 4}
					y={ly - 6}
					data-testid="sparkline-annotation-latest"
					class="font-mono"
					font-size="10"
					text-anchor="end"
					fill="var(--ink, currentColor)"
				>
					{last.value}
				</text>
			{/if}
			{#if scales.focused}
				{@const fx = scales.xScale(scales.focused.year)}
				{@const fy = scales.yScale(scales.focused.value)}
				<circle
					cx={fx}
					cy={fy}
					r="4"
					fill="none"
					stroke="var(--focus-ring, currentColor)"
					stroke-width="1.5"
					data-testid="sparkline-focus"
				/>
			{/if}
		{/snippet}
	</AccessibleChart>
</div>
