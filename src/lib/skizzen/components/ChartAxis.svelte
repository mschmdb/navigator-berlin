<!--
	Gemeinsame x-Achse aller Skizzen-Grafiken: keine Achslinie, dezente Gitterlinien an den Ticks
	über die Plothöhe, Zahlen mit Abstand darunter in Plex Mono, Einheit einmal an der letzten Zahl.
	Erste und letzte Beschriftung stehen nach innen, damit nichts angeschnitten wird.
-->
<script lang="ts">
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
	}
	let { ticks, x, format, unit = '', top, bottom, width }: Props = $props();

	const label = (t: number, i: number) =>
		`${format(t)}${i === ticks.length - 1 && unit ? `\u00a0${unit}` : ''}`;
	/** Nach innen ausrichten, sobald die Beschriftung über den Rand ragen würde (ca. 6,3 px je Zeichen). */
	function anchor(t: number, i: number): 'start' | 'middle' | 'end' {
		const half = (label(t, i).length * 6.3) / 2;
		if (x(t) - half < 0) return 'start';
		if (x(t) + half > width) return 'end';
		return 'middle';
	}
</script>

<g aria-hidden="true">
	{#each ticks as t, i (t)}
		<line
			x1={x(t)}
			x2={x(t)}
			y1={top}
			y2={bottom}
			class="stroke-[var(--rule)]"
			stroke-width="1"
			opacity="0.7"
		/>
		<text
			x={x(t)}
			y={bottom + 9}
			dominant-baseline="hanging"
			text-anchor={anchor(t, i)}
			class="fill-[var(--ink-subtle)] font-mono text-[10.5px] tabular-nums">{label(t, i)}</text
		>
	{/each}
</g>
