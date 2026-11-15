<script lang="ts">
	import { Chart, Circle, Line, Svg, Text, Tooltip } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { dodgeLevels, layoutLabelLanes } from '../dodge';
	import { chartMotion } from './motion.svelte';

	export interface StripItem {
		readonly slug: string;
		readonly name: string;
		readonly value: number | null;
	}

	interface Props {
		items: readonly StripItem[];
		domain: readonly [number, number];
		format: (v: number) => string;
		/** Dieser Ort: groß, Akzent, beschriftet. */
		ownSlug?: string | null;
		/** Kieze des eigenen Bezirks (Bezirksseite) oder Nachbarn: dunkler als der Rest. */
		highlight?: ReadonlySet<string>;
		/** Namen, die als Beschriftung erscheinen, sofern Platz ist. */
		labelSlugs?: readonly string[];
		/** Senkrechte Linie für einen Wert ohne eigenen Punkt (Bezirk/Berlin). */
		markers?: readonly { value: number | null; label: string; strong?: boolean }[];
		/** Bezugspunkt als Ring, wenn er selbst ein Punkt der Verteilung ist. */
		refSlug?: string | null;
		neutral?: boolean;
		onpick?: (slug: string) => void;
	}
	let {
		items,
		domain,
		format,
		ownSlug = null,
		highlight = new Set(),
		labelSlugs = [],
		markers = [],
		refSlug = null,
		neutral = false,
		onpick
	}: Props = $props();

	const R = 2.9;
	const TOP = 18;
	const SWARM = 84;
	const LANE = 13;
	const height = TOP + SWARM + LANE * 2 + 16;
	const mid = TOP + SWARM / 2;
	const maxLevel = Math.floor((SWARM / 2 - R) / (2 * R * 0.86));

	const motion = $derived(chartMotion(450));
	const byValue = $derived(
		[...items].sort((a, b) => (a.value ?? -Infinity) - (b.value ?? -Infinity))
	);
	const own = $derived(items.find((i) => i.slug === ownSlug) ?? null);
	const ref = $derived(items.find((i) => i.slug === refSlug) ?? null);

	function dotClass(slug: string): string {
		if (slug === ownSlug)
			return neutral ? 'fill-[var(--severity-neutral)]' : 'fill-[var(--accent)]';
		if (highlight.has(slug)) return 'fill-[var(--ink)]';
		return 'fill-[var(--rule-strong)] opacity-35';
	}
</script>

<div style:height="{height}px">
	<Chart
		data={byValue}
		x="value"
		xScale={scaleLinear()}
		xDomain={[domain[0], domain[1]]}
		padding={{ top: 0, right: 10, bottom: 0, left: 10 }}
	>
		{#snippet children({ context })}
			{@const xs = byValue.map((i) => (i.value === null ? null : context.xScale(i.value)))}
			{@const levels = dodgeLevels(xs, R, maxLevel)}
			{@const labelled = byValue
				.map((item, idx) => ({ item, x: xs[idx] }))
				.filter((e) => e.x !== null && labelSlugs.includes(e.item.slug) && e.item.slug !== ownSlug)}
			{@const lanes = layoutLabelLanes(
				labelled.map((e) => ({ x: (e.x ?? 0) - 3, width: e.item.name.length * 6.1 })),
				2,
				6
			)}
			<Svg>
				<line x1={0} x2={context.width} y1={mid} y2={mid} class="stroke-[var(--rule)]" />
				{#each markers as mk (mk.label)}
					{#if mk.value !== null}
						<Line
							x1={context.xScale(mk.value)}
							x2={context.xScale(mk.value)}
							y1={TOP - 2}
							y2={TOP + SWARM + 2}
							{motion}
							class={mk.strong ? 'stroke-[var(--accent)]' : 'stroke-[var(--ink)]'}
							strokeWidth={mk.strong ? 2.5 : 1.5}
							dashArray={mk.strong ? undefined : '3 3'}
						/>
					{/if}
				{/each}
				{#each byValue as item, idx (item.slug)}
					{#if xs[idx] !== null && item.slug !== ownSlug}
						<Circle
							cx={xs[idx] ?? 0}
							cy={mid - (levels[idx] ?? 0) * 2 * R * 0.86}
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
					{@const ri = byValue.indexOf(ref)}
					{#if xs[ri] !== null}
						<Circle
							cx={xs[ri] ?? 0}
							cy={mid - (levels[ri] ?? 0) * 2 * R * 0.86}
							r={R + 3}
							{motion}
							class="rv fill-none stroke-[var(--ink)]"
							strokeWidth={2}
						/>
					{/if}
				{/if}
				{#if own && own.value !== null}
					{@const oi = byValue.indexOf(own)}
					{@const ox = xs[oi] ?? 0}
					{@const oy = mid - (levels[oi] ?? 0) * 2 * R * 0.86}
					<Circle
						cx={ox}
						cy={oy}
						r={R + 2.6}
						class="rv {dotClass(own.slug)} stroke-[var(--bg)]"
						strokeWidth={1.5}
					/>
					<Text
						x={Math.min(Math.max(ox, 40), context.width - 40)}
						y={TOP - 6}
						value={`${own.name} ${format(own.value)}`}
						textAnchor="middle"
						class="fill-[var(--accent-strong)] text-[12px] font-semibold"
					/>
				{/if}
				{#each labelled as e, li (e.item.slug)}
					{#if lanes[li] !== null}
						<Text
							x={(e.x ?? 0) - 3}
							y={TOP + SWARM + 10 + (lanes[li] ?? 0) * LANE}
							value={e.item.name}
							class="rv fill-[var(--ink-muted)] text-[11px]"
						/>
					{/if}
				{/each}
				<Text
					x={0}
					y={height - 2}
					value={format(domain[0])}
					class="fill-[var(--chart-axis-text)] text-[11px]"
				/>
				<Text
					x={context.width}
					y={height - 2}
					value={format(domain[1])}
					textAnchor="end"
					class="fill-[var(--chart-axis-text)] text-[11px]"
				/>
			</Svg>
			<Tooltip.Root>
				{#snippet children({ data })}
					{@const d = data as (typeof byValue)[number]}
					<Tooltip.Header value={d.name} />
					<Tooltip.List>
						<Tooltip.Item label="Wert" value={d.value === null ? '–' : format(d.value)} />
					</Tooltip.List>
				{/snippet}
			</Tooltip.Root>
		{/snippet}
	</Chart>
</div>
