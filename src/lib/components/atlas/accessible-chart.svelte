<script lang="ts" module>
	import type { ScaleLinear } from 'd3-scale';

	export interface YearPoint {
		year: number;
		value: number;
	}

	export type LinearScale = ScaleLinear<number, number>;

	export interface ChartScales {
		xScale: LinearScale;
		yScale: LinearScale;
		innerWidth: number;
		innerHeight: number;
		focusedIndex: number;
		focused: YearPoint | null;
	}

	export interface Padding {
		top: number;
		right: number;
		bottom: number;
		left: number;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { scaleLinear } from 'd3-scale';
	import { announceGlobal } from '$lib/utils/aria-live.js';
	import DataTableAlternative, { type TableColumn } from './data-table-alternative.svelte';

	type Row = { year: number; value: number };

	type Props = {
		chartId: string;
		title: string;
		description: string;
		series: readonly YearPoint[];
		figcaption: string;
		width?: number;
		height?: number;
		padding?: Padding;
		yDomain?: [number, number];
		tableCaption: string;
		tableValueLabel?: string;
		tableValueFormat?: (n: number) => string;
		ariaLiveLabel?: (point: YearPoint) => string;
		children?: Snippet<[ChartScales]>;
	};

	let {
		chartId,
		title,
		description,
		series,
		figcaption,
		width = 220,
		height = 90,
		padding = { top: 8, right: 8, bottom: 18, left: 8 },
		yDomain,
		tableCaption,
		tableValueLabel = 'Wert',
		tableValueFormat = (n: number) => String(n),
		ariaLiveLabel,
		children
	}: Props = $props();

	const innerWidth = $derived(Math.max(0, width - padding.left - padding.right));
	const innerHeight = $derived(Math.max(0, height - padding.top - padding.bottom));

	const xDomain = $derived.by<[number, number]>(() => {
		if (series.length === 0) return [0, 1];
		const first = series[0]!.year;
		const last = series[series.length - 1]!.year;
		return first === last ? [first - 0.5, last + 0.5] : [first, last];
	});

	const yDomainResolved = $derived.by<[number, number]>(() => {
		if (yDomain) return yDomain;
		if (series.length === 0) return [0, 1];
		const values = series.map((d) => d.value);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const headroom = (max - min) * 0.1 || 1;
		return [Math.min(0, min), max + headroom];
	});

	const xScale = $derived(scaleLinear().domain(xDomain).range([0, innerWidth]));
	const yScale = $derived(scaleLinear().domain(yDomainResolved).range([innerHeight, 0]));

	let focusedIndex = $state(-1);
	const focusedPoint = $derived(
		focusedIndex >= 0 && focusedIndex < series.length ? series[focusedIndex]! : null
	);

	function announce(point: YearPoint): void {
		const msg = ariaLiveLabel
			? ariaLiveLabel(point)
			: `Jahr ${point.year}: ${tableValueFormat(point.value)}`;
		announceGlobal(msg);
	}

	function onKeydown(event: KeyboardEvent): void {
		if (series.length === 0) return;
		let next: number;
		if (event.key === 'ArrowRight') {
			next = focusedIndex < 0 ? 0 : Math.min(series.length - 1, focusedIndex + 1);
		} else if (event.key === 'ArrowLeft') {
			next = focusedIndex < 0 ? series.length - 1 : Math.max(0, focusedIndex - 1);
		} else if (event.key === 'Home') {
			next = 0;
		} else if (event.key === 'End') {
			next = series.length - 1;
		} else {
			return;
		}
		event.preventDefault();
		focusedIndex = next;
		announce(series[next]!);
	}

	const tableColumns = $derived<TableColumn<Row>[]>([
		{ key: 'year', label: 'Jahr', sortable: true, accessor: (r) => r.year },
		{
			key: 'value',
			label: tableValueLabel,
			sortable: true,
			accessor: (r) => r.value,
			format: (v) => tableValueFormat(Number(v))
		}
	]);

	const tableRows = $derived.by<Row[]>(() =>
		series
			.map((d) => ({ year: d.year, value: d.value }))
			.sort((a, b) => b.year - a.year)
	);

	const titleId = $derived(`chart-title-${chartId}`);
	const descId = $derived(`chart-desc-${chartId}`);

	const scales = $derived<ChartScales>({
		xScale,
		yScale,
		innerWidth,
		innerHeight,
		focusedIndex,
		focused: focusedPoint
	});
</script>

<div class="accessible-chart-container w-full" data-testid="accessible-chart-container">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<figure
		role="img"
		aria-labelledby={titleId}
		aria-describedby={descId}
		tabindex="0"
		data-testid="accessible-chart"
		data-chart-id={chartId}
		data-focused-index={focusedIndex}
		onkeydown={onKeydown}
		class="accessible-chart block w-full focus:outline focus:outline-2 focus:outline-rule-strong focus:outline-offset-2"
	>
		<svg
			width="100%"
			viewBox={`0 0 ${width} ${height}`}
			preserveAspectRatio="xMidYMid meet"
			focusable="false"
			class="block h-auto w-full"
			data-testid="accessible-chart-svg"
		>
			<title id={titleId}>{title}</title>
			<desc id={descId}>{description}</desc>
			<g transform={`translate(${padding.left}, ${padding.top})`}>
				{#if children}
					{@render children(scales)}
				{/if}
			</g>
		</svg>
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
			caption={tableCaption}
		/>
	</div>
</div>
