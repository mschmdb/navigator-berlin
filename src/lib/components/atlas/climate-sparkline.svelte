<script lang="ts" module>
	export type ClimateMetric = 'summer' | 'frost' | 'hot';
</script>

<script lang="ts">
	import type { YearValue } from '$lib/data';
	import { LineChart, Tooltip } from 'layerchart';
	import DataTableAlternative, { type TableColumn } from './data-table-alternative.svelte';
	import { linearRegression } from '$lib/utils/regression.js';
	import { announceGlobal } from '$lib/utils/aria-live.js';
	import { NORMAL_OLD, NORMAL_NEW, getNormalperiodMean } from '$lib/utils/normalperiod.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { formatDecimal } from '$lib/i18n/format.js';

	type Props = {
		series: readonly YearValue[];
		metric: ClimateMetric;
		stationName: string;
		unit?: string;
		/** Kompakt: nur Chart sichtbar, Werte (Min/Max/Mittel) + Tabelle hinter Toggle. */
		compact?: boolean;
		lang?: Locale;
	};

	let { series, metric, stationName, unit = 'Tage/Jahr', compact = false, lang }: Props = $props();
	let detailsOpen = $state(false);

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	const TITLES: Record<ClimateMetric, () => string> = {
		summer: () => m.inspector_climate_summer_title(undefined, localeOpts),
		frost: () => m.inspector_climate_frost_title(undefined, localeOpts),
		hot: () => m.inspector_climate_hot_title(undefined, localeOpts)
	};

	const SHORT_LABELS: Record<ClimateMetric, () => string> = {
		summer: () => m.inspector_climate_summer_short(undefined, localeOpts),
		frost: () => m.inspector_climate_frost_short(undefined, localeOpts),
		hot: () => m.inspector_climate_hot_short(undefined, localeOpts)
	};

	const DEFINITIONS: Record<ClimateMetric, () => string> = {
		summer: () => m.inspector_climate_summer_definition(undefined, localeOpts),
		frost: () => m.inspector_climate_frost_definition(undefined, localeOpts),
		hot: () => m.inspector_climate_hot_definition(undefined, localeOpts)
	};

	const shortLabel = $derived(SHORT_LABELS[metric]());

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
			? m.inspector_climate_sparkline_desc_empty(
					{ metric: shortLabel, station: stationName },
					localeOpts
				)
			: m.inspector_climate_sparkline_desc(
					{
						metric: shortLabel,
						from: String(stats.firstYear),
						station: stationName,
						latest: String(stats.latest),
						unit,
						avg: formatDecimal(stats.avg, { ...localeOpts, maximumFractionDigits: 1, minimumFractionDigits: 1 })
					},
					localeOpts
				)
	);

	const figcaption = $derived(
		stats === null
			? m.inspector_climate_figcaption_empty(undefined, localeOpts)
			: m.inspector_climate_sparkline_figcaption(
					{
						min: String(stats.min),
						max: String(stats.max),
						latest: String(stats.latest),
						unit
					},
					localeOpts
				)
	);

	const normalOldMean = $derived(getNormalperiodMean(points, NORMAL_OLD.from, NORMAL_OLD.to));
	const normalNewMean = $derived(getNormalperiodMean(points, NORMAL_NEW.from, NORMAL_NEW.to));

	// Review-Fund: anders als `climate-long-view.svelte` (dort `toFixed()`,
	// der eigentliche vorbestehende Formatfehler "9,45 °C" → "9.45 °C") nutzte
	// `formatMean` hier bereits `Intl.NumberFormat('de-DE', ...)` und zeigte
	// DE also schon vor B3b korrekt ein Komma. `formatDecimal` (format.ts)
	// reicht dieses Verhalten unverändert durch, reine Konsolidierung.
	function formatMean(n: number): string {
		return formatDecimal(n, { ...localeOpts, maximumFractionDigits: 1 });
	}

	const chartId = $derived(`sparkline-${metric}-${stationName.replace(/\W+/g, '-').toLowerCase()}`);
	const titleId = $derived(`chart-title-${chartId}`);
	const descId = $derived(`chart-desc-${chartId}`);

	let focusedIndex = $state(-1);

	function announceFocus(idx: number): void {
		const r = rows[idx];
		if (!r) return;
		announceGlobal(
			m.inspector_climate_sparkline_announce(
				{
					metric: shortLabel,
					year: String(r.year),
					value: String(r.value),
					unit,
					trend: String(Math.round(r.trend))
				},
				localeOpts
			)
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
		{
			key: 'year',
			label: m.inspector_climate_table_year(undefined, localeOpts),
			sortable: true,
			accessor: (r) => r.year
		},
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
		{shortLabel}
	</h4>
	<p
		class="mb-1 font-serif text-xs text-ink-subtle italic"
		data-testid="climate-sparkline-definition"
	>
		{DEFINITIONS[metric]()}
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
		class="climate-sparkline-figure relative block w-full focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-rule-strong"
	>
		<span id={descId} class="sr-only">{description}</span>
		<span class="sr-only">{TITLES[metric]()}</span>
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
						label: shortLabel,
						color: 'var(--chart-line, currentColor)'
					},
					{
						key: 'trend',
						label: m.inspector_climate_annotation_trend(undefined, localeOpts),
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
								<Tooltip.Item label={shortLabel} value={`${data.value} ${unit}`} />
								<Tooltip.Item
									label={m.inspector_climate_annotation_trend(undefined, localeOpts)}
									value={`${Math.round(data.trend)} ${unit}`}
								/>
							</Tooltip.List>
						</Tooltip.Root>
					{/if}
				{/snippet}
			</LineChart>
			<span data-testid="sparkline-annotation-latest" class="sr-only" aria-hidden="true">
				{stats.latest}
			</span>
		{/if}
	</figure>
	{#if compact}
		<button
			type="button"
			onclick={() => (detailsOpen = !detailsOpen)}
			aria-expanded={detailsOpen}
			data-testid="climate-sparkline-details-toggle"
			class="mt-1 inline-flex items-center gap-1 font-mono text-[11px] tracking-wide text-ink-muted uppercase hover:text-ink"
		>
			{detailsOpen
				? m.inspector_climate_details_toggle_hide(undefined, localeOpts)
				: m.inspector_climate_details_toggle_show(undefined, localeOpts)}
		</button>
	{/if}
	{#if !compact || detailsOpen}
		<div class="mt-1 font-mono text-xs text-ink-subtle" data-testid="chart-figcaption">
			<span class="block">{figcaption}</span>
			{#if normalOldMean !== null}
				<span
					class="mt-0.5 block font-mono text-xs text-ink-subtle"
					data-testid="climate-sparkline-normal-old"
				>
					{m.inspector_climate_normal_old({ value: formatMean(normalOldMean) }, localeOpts)}
				</span>
			{/if}
			{#if normalNewMean !== null}
				<span
					class="block font-mono text-xs text-ink-subtle"
					data-testid="climate-sparkline-normal-new"
				>
					{m.inspector_climate_normal_new({ value: formatMean(normalNewMean) }, localeOpts)}
				</span>
			{/if}
		</div>
		<div class="mt-2">
			<DataTableAlternative
				columns={tableColumns}
				rows={tableRows}
				caption={m.inspector_climate_sparkline_table_caption(
					{ metric: shortLabel, station: stationName },
					localeOpts
				)}
			/>
		</div>
	{/if}
</div>
