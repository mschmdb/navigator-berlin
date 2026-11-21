<script lang="ts" module>
	export interface StripItem {
		readonly slug: string;
		readonly name: string;
		readonly value: number | null;
	}
</script>

<script lang="ts">
	import { Chart, Circle, Line, Svg, Tooltip } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { MediaQuery } from 'svelte/reactivity';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { numberFormat } from '#lib/place/locale.ts';
	import { dodgeLevels } from '#lib/place/dodge.ts';
	import { median, splitsZeros, zeroShare } from '#lib/place/stats.ts';
	import { chartMotion } from './motion.svelte';
	import ChartAxis from './chart-axis.svelte';
	import Hint from './reading-hint.svelte';
	import type { Hint as HintData } from '#lib/place/topics.ts';

	interface Props {
		items: readonly StripItem[];
		domain: readonly [number, number];
		format: (v: number) => string;
		/** Achsenbeschriftung ohne Einheit; die Einheit steht in der Zeilenüberschrift. */
		axisFormat?: (v: number) => string;
		/** Einheit an der letzten Achsenzahl. */
		unit?: string;
		/** Dieser Ort: Akzentblau, groß, vorn, mit senkrechter Linie. */
		ownSlug: string | null;
		/** Nachbarn: schwarz, ohne Dauer-Label. */
		highlight: ReadonlySet<string>;
		highlightLabel: string;
		/** Vergleichsort als Punkt der Verteilung: schwarze Linie mit Ring. */
		refSlug: string | null;
		/** Vergleich ohne eigenen Punkt (etwa Bezirk gesamt): schwarze Linie. */
		refLine: { readonly value: number | null; readonly label: string } | null;
		/** Median aller Punkte, immer gestrichelt eingezeichnet. */
		medianLabel: string;
		/** Name des Nullstapels, etwa „ohne Milieuschutz“. */
		zeroName?: string;
		/** Beschriftung des Medians ohne Nullwerte, etwa „Median der Kieze mit Milieuschutz“. */
		zeroMedianLabel?: string;
		/** Was gezählt wird: „Kieze“ oder „Bezirke“. */
		unitPlural?: string;
		r?: number;
		/** Lesehilfe hinter dem eigenen Wert in der Legende. */
		ownHint?: HintData | null;
		/** Nullblock nur für Kennzahlen ohne Aussage in der Null (Milieuschutz). */
		zeroPile?: boolean;
		/** Richtungswörter unter der Achse (kompaktes Muster). */
		ends?: readonly [string, string] | null;
		onpick?: (slug: string) => void;
	}
	let {
		items,
		domain,
		format,
		axisFormat = (v: number) => numberFormat(0, { locale: getLocale() }).format(v),
		unit = '',
		ownSlug,
		highlight,
		highlightLabel,
		refSlug,
		refLine,
		medianLabel,
		zeroName = m.place_strip_zero_name_default(),
		zeroMedianLabel = m.place_strip_zero_median_default(),
		unitPlural = m.place_units_kieze(),
		r: R = 2.9,
		ownHint = null,
		zeroPile = false,
		ends = null,
		onpick
	}: Props = $props();

	const OWN_R = $derived(R + 3);
	const STEP = $derived(2 * R * 0.86);
	const AXIS = $derived(ends ? 46 : 28);
	const MAX_SWARM = 240;
	const BLOCK_GAP = 6;
	const pad = $derived(OWN_R + 2);
	let width = $state(0);

	// Großer Nullstapel (Milieuschutz): eigener Block statt eines gestauchten Turms im Schwarm.
	const zeros = $derived(zeroShare(items.map((i) => i.value)));
	const splitZeros = $derived(zeroPile && splitsZeros(items.map((i) => i.value)));
	const swarmItems = $derived(splitZeros ? items.filter((i) => i.value !== 0) : items);
	const blockRows = $derived(
		splitZeros ? Math.max(4, Math.min(14, Math.ceil(Math.sqrt(zeros.zeros * 1.4)))) : 0
	);
	const blockCols = $derived(splitZeros ? Math.ceil(zeros.zeros / blockRows) : 0);
	const blockW = $derived(splitZeros ? blockCols * BLOCK_GAP + 16 : 0);

	const byValue = $derived(
		[...swarmItems].sort((a, b) => (a.value ?? -Infinity) - (b.value ?? -Infinity))
	);
	const x = $derived(
		scaleLinear()
			.domain([domain[0], domain[1]])
			.range([0, Math.max(10, width - blockW - 2 * pad)])
	);
	const xs = $derived(byValue.map((i) => (i.value === null ? null : (x(i.value) as number))));

	/*
	 * Kein Layout-Sprung: Die Höhe hängt nur an der Breitenstufe (Handy, Tablet, Desktop), nicht an
	 * der gemessenen Breite. Der Server kennt alle drei Höhen und setzt sie per CSS; der Browser
	 * rechnet die Ebenen für dieselbe Stufe. Ohne Deckel, damit kein Punkt verschwindet.
	 */
	const BUCKETS = [340, 560, 720] as const;
	function layoutFor(plotWidth: number) {
		const sx = scaleLinear()
			.domain([domain[0], domain[1]])
			.range([0, Math.max(10, plotWidth - blockW - 2 * pad)]);
		const lx = byValue.map((i) => (i.value === null ? null : (sx(i.value) as number)));
		const free = dodgeLevels(lx, R, Infinity);
		const needed = Math.max(0, ...free.map((l) => Math.abs(l ?? 0)));
		const capLevel = Math.floor((MAX_SWARM / 2 - OWN_R) / STEP);
		const overflow = needed > capLevel;
		return {
			levels: overflow ? dodgeLevels(lx, R, capLevel) : free,
			overflow,
			swarm: Math.max(
				36,
				blockRows * BLOCK_GAP + 4,
				2 * Math.min(needed, capLevel) * STEP + 2 * OWN_R + 6
			)
		};
	}
	const layouts = $derived(BUCKETS.map((w) => layoutFor(w)));
	const wide = new MediaQuery('(min-width: 1024px)');
	const mid640 = new MediaQuery('(min-width: 640px)');
	const layout = $derived(layouts[wide.current ? 2 : mid640.current ? 1 : 0]);
	const levels = $derived(layout.levels);
	const overflow = $derived(layout.overflow);
	const SWARM = $derived(layout.swarm);
	const mid = $derived(SWARM / 2);
	const yOf = (idx: number) => mid - (levels[idx] ?? 0) * STEP;

	const motion = $derived(chartMotion(450));
	const own = $derived(items.find((i) => i.slug === ownSlug) ?? null);
	const ownIdx = $derived(byValue.findIndex((i) => i.slug === ownSlug));
	const ref = $derived(items.find((i) => i.slug === refSlug) ?? null);
	const refIdx = $derived(byValue.findIndex((i) => i.slug === refSlug));
	const med = $derived(median(swarmItems.map((i) => i.value)));
	const fmt = (v: number | null) => (v === null ? m.place_no_data() : format(v));

	const blockDots = $derived(splitZeros ? items.filter((i) => i.value === 0) : []);
	const blockPos = (bi: number) => ({
		cx: -blockW + (Math.floor(bi / blockRows) + 0.5) * BLOCK_GAP,
		cy: mid - (blockRows * BLOCK_GAP) / 2 + ((bi % blockRows) + 0.5) * BLOCK_GAP
	});
	/** Position eines Orts: im Schwarm oder im Nullblock. */
	function posOf(item: StripItem, idx: number): { cx: number; cy: number } | null {
		if (item.value === null) return null;
		if (splitZeros && item.value === 0) return blockPos(blockDots.indexOf(item));
		return idx >= 0 ? { cx: xs[idx] ?? 0, cy: yOf(idx) } : null;
	}

	// 3 bis 5 Ticks, je nach Breite: auf 390 px nie mehr Beschriftung, als Platz hat.
	const ticks = $derived(
		(
			scaleLinear()
				.domain([domain[0], domain[1]])
				.ticks(Math.max(2, Math.min(4, Math.floor((width - blockW) / 90)))) as number[]
		).filter((t) => t >= domain[0] && t <= domain[1])
	);

	function dotClass(slug: string): string {
		if (highlight.has(slug)) return 'fill-[var(--ink)]';
		return 'fill-[var(--rule-strong)] opacity-35';
	}
</script>

<!-- Legendenzeile mit Werten: keine freien Labels im Plot, die im Schwarm untergehen -->
<ul class="mt-1.5 mb-1 flex flex-wrap gap-x-4 gap-y-1 text-dense-label text-ink-muted tabular-nums">
	{#if own}
		<li class="inline-flex items-center gap-1.5 font-semibold text-accent">
			<svg width="10" height="14" aria-hidden="true"
				><line
					x1="5"
					x2="5"
					y1="0"
					y2="14"
					class="stroke-[var(--accent)]"
					stroke-width="2"
				/><circle cx="5" cy="7" r="4.5" class="fill-[var(--accent)]" /></svg
			>{own.name}
			{fmt(own.value)}
		</li>
	{/if}
	{#if own && ownHint}
		<li><Hint hint={ownHint} short /></li>
	{/if}
	{#if ref}
		<li class="inline-flex items-center gap-1.5 text-ink">
			<span class="size-2.5 rounded-full border-2 border-ink"></span>{ref.name}
			{fmt(ref.value)}
		</li>
	{:else if refLine}
		<li class="inline-flex items-center gap-1.5 text-ink">
			<svg width="4" height="12" aria-hidden="true"
				><line x1="2" x2="2" y1="0" y2="12" class="stroke-[var(--ink)]" stroke-width="2" /></svg
			>{refLine.label}
			{fmt(refLine.value)}
		</li>
	{/if}
	<li class="inline-flex items-center gap-1.5">
		<svg width="4" height="12" aria-hidden="true"
			><line
				x1="2"
				x2="2"
				y1="0"
				y2="12"
				class="stroke-[var(--ink-subtle)]"
				stroke-width="2"
				stroke-dasharray="3 2"
			/></svg
		>{splitZeros ? zeroMedianLabel : medianLabel}
		{fmt(med)}
	</li>
	{#if highlight.size > 0}
		<li class="inline-flex items-center gap-1.5">
			<span class="size-2 rounded-full bg-ink"></span>{highlightLabel}
		</li>
	{/if}
	{#if splitZeros}
		<li class="inline-flex items-center gap-1.5 text-ink">
			<svg width="11" height="11" aria-hidden="true"
				>{#each [0, 1] as cx (cx)}{#each [0, 1] as cy (cy)}<circle
							cx={3 + cx * 5}
							cy={3 + cy * 5}
							r="2"
							class="fill-[var(--rule-strong)]"
						/>{/each}{/each}</svg
			>{m.place_strip_zero_block({ count: zeros.zeros, units: unitPlural, name: zeroName })}
		</li>
	{/if}
</ul>

<div
	bind:clientWidth={width}
	class="h-[var(--h0)] sm:h-[var(--h1)] lg:h-[var(--h2)]"
	style:--h0="{layouts[0].swarm + AXIS}px"
	style:--h1="{layouts[1].swarm + AXIS}px"
	style:--h2="{layouts[2].swarm + AXIS}px"
>
	{#if width > 0}
		<Chart
			data={byValue}
			x="value"
			xScale={scaleLinear()}
			xDomain={[domain[0], domain[1]]}
			padding={{ top: 0, right: pad, bottom: AXIS, left: pad + blockW }}
		>
			{#snippet children({ context })}
				<Svg>
					{#if splitZeros}
						<!-- Nullstapel als Punktraster: jeder Ort ein Punkt, nichts gestaucht -->
						{#each blockDots as item, bi (item.slug)}
							{@const p = blockPos(bi)}
							{#if item.slug !== ownSlug && item.slug !== refSlug}
								<Circle
									cx={p.cx}
									cy={p.cy}
									r={2.3}
									class="rv {dotClass(item.slug)}"
									onpointermove={(e: PointerEvent) => context.tooltip.show(e, item)}
									onpointerleave={() => context.tooltip.hide()}
								/>
							{/if}
						{/each}
					{/if}
					{#if splitZeros}
						<text
							x={-blockW + (blockCols * BLOCK_GAP) / 2}
							y={SWARM + 9}
							dominant-baseline="hanging"
							text-anchor="middle"
							class="fill-[var(--ink-subtle)] text-dense-label tabular-nums">0</text
						>
						<line
							x1={-8}
							x2={-8}
							y1={4}
							y2={SWARM - 4}
							class="stroke-[var(--rule-strong)]"
							stroke-dasharray="1 3"
						/>
					{/if}
					{#if med !== null}
						<Line
							x1={x(med)}
							x2={x(med)}
							y1={2}
							y2={SWARM - 2}
							{motion}
							class="stroke-[var(--ink-subtle)]"
							strokeWidth={1.5}
							dashArray="3 3"
						/>
					{/if}
					{#each byValue as item, idx (item.slug)}
						{#if xs[idx] !== null && item.slug !== ownSlug && item.slug !== refSlug}
							<Circle
								cx={xs[idx] ?? 0}
								cy={yOf(idx)}
								r={R}
								{motion}
								style="--i:{idx}"
								class="rv {dotClass(item.slug)} {onpick ? 'cursor-pointer' : ''}"
								onpointermove={(e: PointerEvent) => context.tooltip.show(e, item)}
								onpointerleave={() => context.tooltip.hide()}
								onclick={() => onpick?.(item.slug)}
							/>
						{/if}
					{/each}
					{#if ref}
						{@const p = posOf(ref, refIdx)}
						{#if p}
							<Line
								x1={p.cx}
								x2={p.cx}
								y1={2}
								y2={SWARM - 2}
								{motion}
								class="stroke-[var(--ink)]"
								strokeWidth={1.5}
							/>
							<Circle
								cx={p.cx}
								cy={p.cy}
								r={R + 2.5}
								{motion}
								class="fill-[var(--bg)] stroke-[var(--ink)]"
								strokeWidth={2}
								onpointermove={(e: PointerEvent) => context.tooltip.show(e, ref)}
								onpointerleave={() => context.tooltip.hide()}
							/>
						{/if}
					{:else if refLine && refLine.value !== null}
						<Line
							x1={x(refLine.value)}
							x2={x(refLine.value)}
							y1={2}
							y2={SWARM - 2}
							{motion}
							class="stroke-[var(--ink)]"
							strokeWidth={1.5}
						/>
					{/if}
					{#if own}
						{@const p = posOf(own, ownIdx)}
						{#if p}
							<!-- Linie über die ganze Höhe: die Position bleibt auch im dichten Cluster lesbar -->
							<Line
								x1={p.cx}
								x2={p.cx}
								y1={0}
								y2={SWARM}
								class="stroke-[var(--accent)]"
								strokeWidth={2}
							/>
							<Circle
								cx={p.cx}
								cy={p.cy}
								r={OWN_R}
								class="fill-[var(--accent)] stroke-[var(--bg)]"
								strokeWidth={2}
								onpointermove={(e: PointerEvent) => context.tooltip.show(e, own)}
								onpointerleave={() => context.tooltip.hide()}
							/>
						{/if}
					{/if}
					<ChartAxis {ticks} format={axisFormat} {unit} {ends} />
				</Svg>
				<Tooltip.Root>
					{#snippet children({ data })}
						{@const d = data as StripItem}
						<Tooltip.Header value={d.name} />
						<Tooltip.List>
							<Tooltip.Item label={m.place_strip_value()} value={fmt(d.value)} />
						</Tooltip.List>
					{/snippet}
				</Tooltip.Root>
			{/snippet}
		</Chart>
	{/if}
</div>
{#if overflow}
	<p class="text-dense-label text-ink-subtle">
		{m.place_strip_overlap()}
	</p>
{/if}
