<script lang="ts">
	import type { YearValue } from '$lib/data';
	import AccessibleChart, {
		type ChartScales,
		type YearPoint
	} from './accessible-chart.svelte';
	import {
		BERLIN_NARRATIVE_MARKERS,
		markersInRange,
		type NarrativeMarker
	} from './internal/narrative-markers.js';
	import { rollingMean } from '$lib/utils/rolling-mean.js';

	type Props = {
		series: readonly YearValue[];
		stationName: string;
		unit?: string;
		narrativeMarkers?: readonly NarrativeMarker[];
	};

	let {
		series,
		stationName,
		unit = '°C',
		narrativeMarkers = BERLIN_NARRATIVE_MARKERS
	}: Props = $props();

	const points = $derived<YearPoint[]>(
		series
			.filter((d) => typeof d.temp === 'number')
			.map((d) => ({ year: d.year, value: d.temp as number }))
	);

	const stats = $derived.by(() => {
		if (points.length === 0) {
			return { min: 0, max: 0, latest: 0, latestYear: 0, firstYear: 0 };
		}
		const values = points.map((p) => p.value);
		return {
			min: Math.min(...values),
			max: Math.max(...values),
			latest: points[points.length - 1]!.value,
			latestYear: points[points.length - 1]!.year,
			firstYear: points[0]!.year
		};
	});

	const rolling = $derived.by(() => {
		if (points.length < 30) return [];
		const src = points.map((p) => ({ year: p.year, temp: p.value }));
		return rollingMean(src, 30, 'temp').map((d) => ({ year: d.year, value: d.temp }));
	});

	const visibleMarkers = $derived(
		points.length === 0 ? [] : markersInRange(narrativeMarkers, stats.firstYear, stats.latestYear)
	);

	const description = $derived(
		points.length === 0
			? `Keine Daten für Jahresmitteltemperatur an Station ${stationName}.`
			: `Jahresmitteltemperatur ${stationName} von ${stats.firstYear} bis ${stats.latestYear}. Aktueller Wert ${stats.latest.toFixed(2)} ${unit}. ${rolling.length > 0 ? `30-Jahr-Mittel zuletzt ${rolling[rolling.length - 1]!.value.toFixed(2)} ${unit}.` : ''}`
	);

	const figcaption = $derived(
		points.length === 0
			? 'Keine Daten verfügbar.'
			: `Min: ${stats.min.toFixed(1)} °C · Max: ${stats.max.toFixed(1)} °C · Latest: ${stats.latest.toFixed(2)} °C`
	);

	const chartId = $derived(
		`long-view-${stationName.replace(/\W+/g, '-').toLowerCase()}`
	);

	function linePath(scales: ChartScales, data: YearPoint[]): string {
		if (data.length === 0) return '';
		const { xScale, yScale } = scales;
		return data
			.map(
				(p, i) =>
					`${i === 0 ? 'M' : 'L'} ${xScale(p.year).toFixed(2)} ${yScale(p.value).toFixed(2)}`
			)
			.join(' ');
	}
</script>

<div class="climate-long-view" data-testid="climate-long-view">
	<AccessibleChart
		{chartId}
		title={`Jahresmitteltemperatur ${stationName}`}
		{description}
		series={points}
		{figcaption}
		width={720}
		height={280}
		padding={{ top: 24, right: 32, bottom: 32, left: 40 }}
		tableCaption={`Jahresmitteltemperatur ${stationName}`}
		tableValueLabel={unit}
		tableValueFormat={(n) => `${Number(n).toFixed(2)} ${unit}`}
	>
		{#snippet children(scales)}
			{@const mainPath = linePath(scales, points)}
			{@const rollingPath = linePath(scales, rolling)}
			{#if mainPath}
				<path
					d={mainPath}
					data-testid="long-view-line"
					stroke="var(--chart-line, currentColor)"
					stroke-width="1"
					fill="none"
					opacity="0.6"
				/>
			{/if}
			{#if rollingPath}
				<path
					d={rollingPath}
					data-testid="long-view-rolling"
					stroke="var(--chart-line-secondary, currentColor)"
					stroke-width="2"
					fill="none"
				/>
			{/if}
			{#each visibleMarkers as marker (marker.year)}
				{@const mx = scales.xScale(marker.year)}
				<g
					data-testid="long-view-marker"
					data-marker-year={marker.year}
					class="long-view-marker"
				>
					<line
						x1={mx}
						y1={0}
						x2={mx}
						y2={scales.innerHeight}
						stroke="var(--rule, currentColor)"
						stroke-width="1"
						stroke-dasharray="2 3"
					/>
					<text
						x={mx + 4}
						y={12}
						class="font-serif italic"
						font-size="10"
						fill="var(--ink-subtle, currentColor)"
					>
						{marker.label}
					</text>
				</g>
			{/each}
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
					data-testid="long-view-focus"
				/>
			{/if}
		{/snippet}
	</AccessibleChart>
</div>
