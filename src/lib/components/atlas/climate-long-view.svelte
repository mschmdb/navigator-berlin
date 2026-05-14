<script lang="ts">
	import type { YearValue } from '$lib/data';
	import { AreaChart, Tooltip } from 'layerchart';
	import DataTableAlternative, { type TableColumn } from './data-table-alternative.svelte';
	import {
		BERLIN_NARRATIVE_MARKERS,
		markersInRange,
		type NarrativeMarker
	} from './internal/narrative-markers.js';
	import { rollingMean } from '$lib/utils/rolling-mean.js';
	import { announceGlobal } from '$lib/utils/aria-live.js';

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

	type Row = { year: number; value: number; rolling: number | null };

	const points = $derived(
		series
			.filter((d) => typeof d.temp === 'number')
			.map((d) => ({ year: d.year, value: d.temp as number }))
	);

	const rolling = $derived.by(() => {
		if (points.length < 30) return new Map<number, number>();
		const src = points.map((p) => ({ year: p.year, temp: p.value }));
		const out = rollingMean(src, 30, 'temp');
		return new Map(out.map((d) => [d.year, d.temp] as const));
	});

	const rows = $derived<Row[]>(
		points.map((p) => ({
			year: p.year,
			value: p.value,
			rolling: rolling.get(p.year) ?? null
		}))
	);

	const stats = $derived.by(() => {
		if (rows.length === 0) return null;
		const values = rows.map((r) => r.value);
		return {
			min: Math.min(...values),
			max: Math.max(...values),
			latest: rows[rows.length - 1]!.value,
			latestYear: rows[rows.length - 1]!.year,
			firstYear: rows[0]!.year
		};
	});

	const description = $derived(
		stats === null
			? `Keine Daten für Jahresmitteltemperatur an Station ${stationName}.`
			: `Jahresmitteltemperatur ${stationName} von ${stats.firstYear} bis ${stats.latestYear}. Aktueller Wert ${stats.latest.toFixed(2)} ${unit}.`
	);

	const figcaption = $derived(
		stats === null
			? 'Keine Daten verfügbar.'
			: `Min: ${stats.min.toFixed(1)} ${unit} · Max: ${stats.max.toFixed(1)} ${unit} · Latest: ${stats.latest.toFixed(2)} ${unit}`
	);

	const chartId = $derived(
		`long-view-${stationName.replace(/\W+/g, '-').toLowerCase()}`
	);
	const titleId = $derived(`chart-title-${chartId}`);
	const descId = $derived(`chart-desc-${chartId}`);

	const visibleMarkers = $derived(
		stats === null
			? []
			: markersInRange(narrativeMarkers, stats.firstYear, stats.latestYear)
	);

	const decadeTicks = $derived.by<number[]>(() => {
		if (stats === null) return [];
		const start = Math.ceil(stats.firstYear / 10) * 10;
		const end = Math.floor(stats.latestYear / 10) * 10;
		const out: number[] = [];
		for (let y = start; y <= end; y += 20) out.push(y);
		return out;
	});

	const yTicks = $derived.by<number[]>(() => {
		if (stats === null) return [];
		const mid = (stats.min + stats.max) / 2;
		return [
			Math.floor(stats.min),
			Math.round(mid * 10) / 10,
			Math.ceil(stats.max)
		];
	});

	let focusedIndex = $state(-1);

	function announceFocus(idx: number): void {
		const r = rows[idx];
		if (!r) return;
		announceGlobal(
			`Jahresmitteltemperatur ${r.year}, ${r.value.toFixed(2)} ${unit}${r.rolling != null ? `, 30-Jahr-Mittel ${r.rolling.toFixed(2)} ${unit}` : ''}`
		);
	}

	function onKeydown(event: KeyboardEvent): void {
		if (rows.length === 0) return;
		let next = focusedIndex;
		if (event.key === 'ArrowRight') {
			next = focusedIndex < 0 ? 0 : Math.min(rows.length - 1, focusedIndex + 1);
		} else if (event.key === 'ArrowLeft') {
			next = focusedIndex < 0 ? rows.length - 1 : Math.max(0, focusedIndex - 1);
		} else if (event.key === 'Home') {
			next = 0;
		} else if (event.key === 'End') {
			next = rows.length - 1;
		} else {
			return;
		}
		event.preventDefault();
		focusedIndex = next;
		announceFocus(next);
	}

	const tableColumns = $derived<TableColumn<Row>[]>([
		{ key: 'year', label: 'Jahr', sortable: true, accessor: (r) => r.year },
		{
			key: 'value',
			label: `Wert (${unit})`,
			sortable: true,
			accessor: (r) => r.value,
			format: (v) => `${Number(v).toFixed(2)} ${unit}`
		}
	]);

	const tableRows = $derived([...rows].sort((a, b) => b.year - a.year));
</script>

<div class="climate-long-view" data-testid="climate-long-view">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<figure
		role="img"
		aria-labelledby={titleId}
		aria-describedby={descId}
		tabindex={rows.length > 0 ? 0 : -1}
		data-testid="climate-long-view-figure"
		data-chart-id={chartId}
		data-focused-index={focusedIndex}
		onkeydown={onKeydown}
		class="climate-long-view-figure relative block w-full focus:outline focus:outline-2 focus:outline-rule-strong focus:outline-offset-2"
	>
		<span id={titleId} class="sr-only">Jahresmitteltemperatur {stationName}</span>
		<span id={descId} class="sr-only">{description}</span>
		{#if rows.length > 0 && stats}
			<AreaChart
				data={rows}
				x="year"
				height={180}
				padding={{ top: 18, right: 20, bottom: 28, left: 36 }}
				series={[
					{
						key: 'value',
						label: 'Jahresmittel',
						color: 'var(--chart-line, currentColor)',
						props: {
							fill: 'var(--chart-area, currentColor)',
							fillOpacity: 0.35,
							line: true
						}
					},
					{
						key: 'rolling',
						label: '30-Jahr-Mittel',
						color: 'var(--chart-line-secondary, currentColor)',
						props: {
							fillOpacity: 0,
							line: { 'stroke-dasharray': '4 4', 'stroke-width': 2 }
						}
					}
				]}
				axis={true}
				grid={false}
				rule={false}
				props={{
					xAxis: { ticks: decadeTicks },
					yAxis: { ticks: yTicks }
				}}
			>
				{#snippet aboveMarks({ context })}
					{@const xScale = context.xScale}
					{@const innerHeight = context.height}
					{#each visibleMarkers as marker (marker.year)}
						{@const mx = Number(xScale(marker.year))}
						{#if Number.isFinite(mx)}
							<g
								data-testid="long-view-marker"
								data-marker-year={marker.year}
								class="long-view-marker"
							>
								<line
									x1={mx}
									y1={0}
									x2={mx}
									y2={innerHeight}
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
						{/if}
					{/each}
				{/snippet}

				{#snippet tooltip({ context })}
					{@const data = context.tooltip.data as Row | null}
					{#if data}
						<Tooltip.Root>
							<Tooltip.Header value={String(data.year)} />
							<Tooltip.List>
								<Tooltip.Item
									label="Jahresmittel"
									value={`${data.value.toFixed(2)} ${unit}`}
								/>
								{#if data.rolling != null}
									<Tooltip.Item
										label="30-Jahr-Mittel"
										value={`${data.rolling.toFixed(2)} ${unit}`}
									/>
								{/if}
							</Tooltip.List>
						</Tooltip.Root>
					{/if}
				{/snippet}
			</AreaChart>
		{/if}
		<figcaption
			class="mt-1 font-mono text-xs text-ink-subtle"
			data-testid="chart-figcaption"
		>
			{figcaption}
		</figcaption>
	</figure>
	<div class="mt-2">
		<DataTableAlternative
			columns={tableColumns}
			rows={tableRows}
			caption={`Jahresmitteltemperatur ${stationName}`}
		/>
	</div>
</div>
