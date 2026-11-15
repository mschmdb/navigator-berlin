<script lang="ts">
	import { formatPercent } from '$lib/i18n/format.js';
	import { Chart, Circle, Spline, Svg, Text } from 'layerchart';
	import ChartAxis from './chart-axis.svelte';
	import { scaleLinear } from 'd3-scale';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import {} from '$lib/place/labels';
	import { partiesOf, seriesFor } from '$lib/place/wahl-summary';
	import type { WahlPunkt } from '$lib/place/wahl-types';
	import { chartMotion } from './motion.svelte';

	interface Props {
		own: readonly WahlPunkt[];
		ref: readonly WahlPunkt[];
		ownLabel: string;
		refLabel: string;
	}
	let { own, ref, ownLabel, refLabel }: Props = $props();

	const parties = $derived(partiesOf(own).slice(0, 6));
	const years = $derived([...new Set(own.map((p) => p.jahr))].sort((a, b) => a - b));
	// Gemeinsame y-Achse für alle Kacheln: sonst sähe 8 % so groß aus wie 30 %.
	const yMax = $derived(
		Math.max(
			10,
			Math.ceil(Math.max(...own.map((p) => p.anteil), ...ref.map((p) => p.anteil)) / 10) * 10
		)
	);
	const motion = $derived(chartMotion(450));
	const fmt = (v: number) => formatPercent(v / 100, { decimals: 0, locale: getLocale() });
</script>

<div class="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-dense-label text-ink-muted">
	<span class="inline-flex items-center gap-1.5"
		><span class="h-0.5 w-5 bg-ink"></span>{m.place_party_colour({ label: ownLabel })}</span
	>
	<span class="inline-flex items-center gap-1.5"
		><span class="w-5 border-t-2 border-dashed border-ink-subtle"></span>{refLabel}</span
	>
</div>
<ul class="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
	{#each parties as partei (partei)}
		{@const s = seriesFor(own, partei)}
		{@const r = seriesFor(ref, partei).filter((p) => years.includes(p.jahr))}
		{@const last = s[s.length - 1]}
		<li class="min-w-0">
			<p class="flex items-baseline justify-between text-sm">
				<span class="font-semibold text-ink">{partei}</span>
				<span class="text-ink-muted tabular-nums">{fmt(last.anteil)}</span>
			</p>
			<div class="h-32">
				<Chart
					data={s}
					x="jahr"
					y="anteil"
					xScale={scaleLinear()}
					xDomain={[years[0], years[years.length - 1]]}
					yDomain={[0, yMax]}
					padding={{ top: 6, right: 8, bottom: 24, left: 8 }}
				>
					{#snippet children({ context })}
						<Svg>
							<line
								x1={0}
								x2={context.width}
								y1={context.height}
								y2={context.height}
								class="stroke-[var(--rule)]"
							/>
							<line
								x1={0}
								x2={context.width}
								y1={context.yScale(yMax / 2)}
								y2={context.yScale(yMax / 2)}
								class="stroke-[var(--chart-grid)]"
								stroke-dasharray="1 3"
							/>
							{#if r.length > 1}
								<Spline
									data={r}
									x="jahr"
									y="anteil"
									{motion}
									class="rv fill-none stroke-[var(--ink-subtle)] [stroke-dasharray:4_3]"
									strokeWidth={1.5}
								/>
							{/if}
							<Spline
								data={s}
								x="jahr"
								y="anteil"
								class="rv fill-none"
								stroke={last.farbe}
								strokeWidth={2.5}
							/>
							{#each s as p (p.jahr)}
								<Circle
									cx={context.xScale(p.jahr)}
									cy={context.yScale(p.anteil)}
									r={2.8}
									fill={last.farbe}
									class="rv"
								/>
							{/each}
							<ChartAxis
								ticks={years}
								x={(v) => context.xScale(v)}
								format={(v) => `’${String(v).slice(2)}`}
								top={0}
								bottom={context.height}
								width={context.width}
							/>
							<Text
								x={0}
								y={context.yScale(yMax / 2) - 3}
								value={fmt(yMax / 2)}
								class="fill-[var(--ink-subtle)] text-[10px]"
							/>
						</Svg>
					{/snippet}
				</Chart>
			</div>
		</li>
	{/each}
</ul>
