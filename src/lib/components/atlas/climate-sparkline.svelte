<script lang="ts" module>
	export type ClimateMetric = 'summer' | 'frost' | 'hot';
</script>

<script lang="ts">
	import type { YearValue } from '$lib/data';
	import { LineChart, Tooltip } from 'layerchart';
	import DataTableAlternative, { type TableColumn } from './data-table-alternative.svelte';
	import { linearRegression } from '$lib/utils/regression.js';
	import { announceGlobal } from '$lib/utils/aria-live.js';
	import {
		NORMAL_OLD,
		NORMAL_NEW,
		getNormalperiodMean
	} from '$lib/utils/normalperiod.js';

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

	const DEFINITIONS: Record<ClimateMetric, string> = {
		summer: 'Tage mit Tagesmaximum ≥ 25 °C',
		frost: 'Tage mit Tagesminimum < 0 °C',
		hot: 'Tage mit Tagesmaximum ≥ 30 °C'
	};

	type Row = { year: number; value: number; trend: number };

	const points = $derived(
		series
			.filter((d) => typeof d.count === 'number')
			.map((d) => ({ year: d.year, value: d.count as number }))
	);

	const fit = $derived.by(() => {
		if (points.length < 2) return null;
		return linearRegression(
			points,
			(p) => p.year,
			(p) => p.value
		);
	});

	const rows = $derived<Row[]>(
		fit
			? points.map((p) => ({ year: p.year, value: p.value, trend: fit.predict(p.year) }))
			: points.map((p) => ({ year: p.year, value: p.value, trend: p.value }))
	);

	const stats = $derived.by(() => {
		if (rows.length === 0) return null;
		const values = rows.map((r) => r.value);
		return {
			min: Math.min(...values),
			max: Math.max(...values),
			latest: rows[rows.length - 1]!.value,
			firstYear: rows[0]!.year,
			latestYear: rows[rows.length - 1]!.year,
			avg: values.reduce((a, b) => a + b, 0) / values.length
		};
	});

	const description = $derived(
		stats === null
			? `Keine Daten für ${SHORT_LABELS[metric]} an DWD-Station ${stationName}.`
			: `Sparkline ${SHORT_LABELS[metric]} pro Jahr seit ${stats.firstYear} für DWD-Station ${stationName}. Aktueller Wert ${stats.latest} ${unit}, Mittelwert ${stats.avg.toFixed(1)}.`
	);

	const figcaption = $derived(
		stats === null
			? 'Keine Daten verfügbar.'
			: `Min: ${stats.min} · Max: ${stats.max} · Latest: ${stats.latest} ${unit}`
	);

	const normalOldMean = $derived(
		getNormalperiodMean(points, NORMAL_OLD.from, NORMAL_OLD.to)
	);
	const normalNewMean = $derived(
		getNormalperiodMean(points, NORMAL_NEW.from, NORMAL_NEW.to)
	);

	function formatMean(n: number): string {
		return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(n);
	}

	const chartId = $derived(
		`sparkline-${metric}-${stationName.replace(/\W+/g, '-').toLowerCase()}`
	);
	const titleId = $derived(`chart-title-${chartId}`);
	const descId = $derived(`chart-desc-${chartId}`);

	let focusedIndex = $state(-1);

	function announceFocus(idx: number): void {
		const r = rows[idx];
		if (!r) return;
		announceGlobal(
			`${SHORT_LABELS[metric]} ${r.year}, ${r.value} ${unit}, Trend ${Math.round(r.trend)} ${unit}`
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
			label: unit,
			sortable: true,
			accessor: (r) => r.value,
			format: (v) => String(v)
		}
	]);

	const tableRows = $derived([...rows].sort((a, b) => b.year - a.year));
</script>

<div class="climate-sparkline" data-testid="climate-sparkline" data-metric={metric}>
	<h4
		class="mb-0.5 font-serif text-sm text-ink"
		data-testid="climate-sparkline-heading"
		id={titleId}
	>
		{SHORT_LABELS[metric]}
	</h4>
	<p
		class="mb-1 font-serif text-xs italic text-ink-subtle"
		data-testid="climate-sparkline-definition"
	>
		{DEFINITIONS[metric]}
	</p>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<figure
		role="img"
		aria-labelledby={titleId}
		aria-describedby={descId}
		tabindex={rows.length > 0 ? 0 : -1}
		data-testid="climate-sparkline-figure"
		data-chart-id={chartId}
		data-focused-index={focusedIndex}
		onkeydown={onKeydown}
		class="climate-sparkline-figure relative block w-full focus:outline focus:outline-2 focus:outline-rule-strong focus:outline-offset-2"
	>
		<span id={descId} class="sr-only">{description}</span>
		<span class="sr-only">{TITLES[metric]}</span>
		{#if rows.length > 0 && stats}
			<LineChart
				data={rows}
				x="year"
				height={64}
				padding={{ top: 12, right: 36, bottom: 8, left: 8 }}
				yBaseline={null}
				yPadding={[6, 6]}
				series={[
					{
						key: 'value',
						label: SHORT_LABELS[metric],
						color: 'var(--chart-line, currentColor)'
					},
					{
						key: 'trend',
						label: 'Trend',
						color: 'var(--chart-line-secondary, currentColor)',
						props: { 'stroke-dasharray': '2 2' }
					}
				]}
				axis={false}
				grid={false}
				rule={false}
				annotations={[
					{
						type: 'point',
						x: stats.latestYear,
						y: stats.latest,
						r: 2.5,
						label: String(stats.latest),
						labelPlacement: 'right',
						labelXOffset: 4
					}
				]}
			>
				{#snippet tooltip({ context })}
					{@const data = context.tooltip.data as Row | null}
					{#if data}
						<Tooltip.Root>
							<Tooltip.Header value={String(data.year)} />
							<Tooltip.List>
								<Tooltip.Item
									label={SHORT_LABELS[metric]}
									value={`${data.value} ${unit}`}
								/>
								<Tooltip.Item
									label="Trend"
									value={`${Math.round(data.trend)} ${unit}`}
								/>
							</Tooltip.List>
						</Tooltip.Root>
					{/if}
				{/snippet}
			</LineChart>
			<span
				data-testid="sparkline-annotation-latest"
				class="sr-only"
				aria-hidden="true"
			>
				{stats.latest}
			</span>
		{/if}
		<figcaption
			class="mt-1 font-mono text-xs text-ink-subtle"
			data-testid="chart-figcaption"
		>
			<span class="block">{figcaption}</span>
			{#if normalOldMean !== null}
				<span
					class="mt-0.5 block font-mono text-xs text-ink-subtle"
					data-testid="climate-sparkline-normal-old"
				>
					Mittel 1961–1990: {formatMean(normalOldMean)}
				</span>
			{/if}
			{#if normalNewMean !== null}
				<span
					class="block font-mono text-xs text-ink-subtle"
					data-testid="climate-sparkline-normal-new"
				>
					Mittel 1991–2020: {formatMean(normalNewMean)}
				</span>
			{/if}
		</figcaption>
	</figure>
	<div class="mt-2">
		<DataTableAlternative
			columns={tableColumns}
			rows={tableRows}
			caption={`${SHORT_LABELS[metric]} bei ${stationName}`}
		/>
	</div>
</div>
