<!--
	Gemeinsame x-Achse aller Grafiken der Kiez- und Bezirksseiten: keine Achslinie, dezente Gitterlinien an den Ticks
	über die Plothöhe, Zahlen mit Abstand darunter in Plex Mono, Einheit einmal an der letzten Zahl.
	Erste und letzte Beschriftung stehen nach innen, damit nichts angeschnitten wird.
-->
<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime';
	import { layoutAxisLabels, trimZeroDecimals } from '$lib/place/axis';

	interface Props {
		ticks: readonly number[];
		x: (v: number) => number;
		format: (v: number) => string;
		/** Einheit an der letzten Zahl, etwa „Punkte“ oder „€/m²“. */
		unit?: string;
		/** Oberkante und Unterkante der Gitterlinien (Plotbereich). */
		top: number;
		bottom: number;
		width: number;
		/** Richtung unter der Achse: links „← weniger“, rechts „mehr →“. */
		ends?: readonly [string, string] | null;
	}
	let { ticks, x, format, unit = '', top, bottom, width, ends = null }: Props = $props();

	// Ca. 6,3 px je Zeichen bei 10,5 px Plex Mono.
	const labels = $derived.by(() => {
		const decimalSep = getLocale() === 'en' ? '.' : ',';
		const texts = trimZeroDecimals(
			ticks.map((t) => format(t)),
			ticks,
			decimalSep
		).map((t, i) => (i === ticks.length - 1 && unit ? `${t}\u00a0${unit}` : t));
		return layoutAxisLabels(
			texts,
			ticks.map((t) => x(t)),
			width,
			6.3
		);
	});
</script>

<g aria-hidden="true">
	{#each ticks as t, i (t)}
		{@const l = labels[i]}
		<line
			x1={x(t)}
			x2={x(t)}
			y1={top}
			y2={bottom}
			class="stroke-[var(--rule)]"
			stroke-width="1"
			opacity="0.7"
		/>
		{#if l.visible}
			<text
				x={l.x}
				y={bottom + 9}
				dominant-baseline="hanging"
				text-anchor={l.anchor}
				class="fill-[var(--ink-subtle)] font-mono text-[10.5px] tabular-nums">{l.text}</text
			>
		{/if}
	{/each}
	{#if ends}
		<text
			x={0}
			y={bottom + 25}
			dominant-baseline="hanging"
			class="fill-[var(--ink-subtle)] text-[11px]">← {ends[0]}</text
		>
		<text
			x={width}
			y={bottom + 25}
			dominant-baseline="hanging"
			text-anchor="end"
			class="fill-[var(--ink-subtle)] text-[11px]">{ends[1]} →</text
		>
	{/if}
</g>
