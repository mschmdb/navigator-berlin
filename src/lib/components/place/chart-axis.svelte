<!--
	Gemeinsame x-Achse der Kiez- und Bezirksseiten, gebaut mit LayerChart `Axis`: keine Achslinie,
	dezente Gitterlinien an den Ticks über die Plothöhe, Zahlen mit Abstand darunter (Sans, tabular-nums),
	Einheit einmal an der letzten Zahl. Das eigene `tickLabel`-Snippet blendet Beschriftungen aus,
	die sich berühren würden, und richtet die Ränder nach innen aus (`layoutAxisLabels`).
-->
<script lang="ts">
	import { Axis, Text, getChartContext } from 'layerchart';
	import { getLocale } from '$lib/paraglide/runtime';
	import { layoutAxisLabels, trimZeroDecimals } from '$lib/place/axis';

	interface Props {
		ticks: readonly number[];
		format: (v: number) => string;
		/** Einheit an der letzten Zahl, etwa „Punkte“ oder „€/m²“. */
		unit?: string;
		/** Richtung unter der Achse: links „← weniger“, rechts „mehr →“. */
		ends?: readonly [string, string] | null;
	}
	let { ticks, format, unit = '', ends = null }: Props = $props();

	const context = getChartContext();

	// Ca. 7,2 px je Zeichen bei 12 px Sans mit tabular-nums, eher großzügig geschätzt.
	const labels = $derived.by(() => {
		const decimalSep = getLocale() === 'en' ? '.' : ',';
		const texts = trimZeroDecimals(
			ticks.map((t) => format(t)),
			ticks,
			decimalSep
		).map((t, i) => (i === ticks.length - 1 && unit ? `${t}\u00a0${unit}` : t));
		return layoutAxisLabels(
			texts,
			ticks.map((t) => context.xScale(t) as number),
			context.width,
			7.2
		);
	});
</script>

<Axis
	placement="bottom"
	ticks={[...ticks]}
	rule={false}
	tickMarks={false}
	grid={{ class: 'stroke-[var(--rule)]', opacity: 0.7 }}
>
	{#snippet tickLabel({ index })}
		{@const l = labels[index]}
		{#if l?.visible}
			<Text
				x={l.x}
				y={context.height + 9}
				value={l.text}
				textAnchor={l.anchor}
				verticalAnchor="start"
				class="fill-[var(--ink-subtle)] text-dense-label tabular-nums"
			/>
		{/if}
	{/snippet}
</Axis>
{#if ends}
	<Text
		x={0}
		y={context.height + 28}
		value={`← ${ends[0]}`}
		verticalAnchor="start"
		class="fill-[var(--ink-subtle)] text-dense-label"
		aria-hidden="true"
	/>
	<Text
		x={context.width}
		y={context.height + 28}
		value={`${ends[1]} →`}
		textAnchor="end"
		verticalAnchor="start"
		class="fill-[var(--ink-subtle)] text-dense-label"
		aria-hidden="true"
	/>
{/if}
