<!--
	Umriss-Karte zur Orientierung: Gebiete nach Kiez-Score eingefärbt, der eigene Ort mit dicker
	Kontur obenauf. Die Karte ist eine statische SVG-Datei (`/karte/…`, siehe maps.server.ts),
	eingebunden als Bild mit Alternativtext; die Werte stehen in den Tabellen der Seite.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { NO_SCORE_FILL } from '#lib/components/atlas/internal/score-class-color.js';
	import { PLACE_MAP_FILLS } from '#lib/place/map-classes.ts';
	import type { MapImage } from '#lib/place/types.ts';

	interface Props {
		/** Statische SVG-Datei (`/karte/…`), Breite und Höhe gegen Layoutsprünge. */
		image: MapImage;
		/** Name des eigenen Orts für die Legende („Reuterstraße: dick umrandet“). */
		ownName?: string | null;
		/** Lage-Kärtchen ohne Score-Farben und ohne Legende. */
		plain?: boolean;
		label: string;
		legend?: boolean;
		class?: string;
	}
	let {
		image,
		ownName = null,
		plain = false,
		label,
		legend = true,
		class: cls = ''
	}: Props = $props();

	const RANGES = [
		[0, 25],
		[26, 50],
		[51, 75],
		[76, 100]
	] as const;
	const classes = $derived(
		RANGES.map(([from, to], i) => ({
			fill: PLACE_MAP_FILLS[i],
			text: m.place_map_range({ from, to })
		}))
	);
</script>

<figure class="m-0 flex flex-col gap-2 {cls}">
	<img
		src={image.src}
		width={image.width}
		height={image.height}
		alt={label}
		decoding="async"
		class="block h-auto max-h-72 w-full object-contain object-left"
	/>
	{#if legend && !plain}
		<!-- Zahlenbereich direkt unter jedem Feld, die Helligkeit stuft deutlich ab: lesbar ohne Farbe. -->
		<figcaption class="flex flex-col gap-1.5 text-dense-label text-ink-muted">
			<span class="text-ink">{m.place_map_legend_title()}</span>
			<ol class="m-0 grid list-none grid-cols-4 gap-0.5 p-0">
				{#each classes as c (c.text)}
					<li class="flex flex-col gap-1">
						<span class="block h-3 border border-rule-strong" style:background-color={c.fill}
						></span>
						<span class="tabular-nums">{c.text}</span>
					</li>
				{/each}
			</ol>
			<ul class="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
				{#if ownName}
					<li class="inline-flex items-center gap-1.5">
						<span class="inline-block size-3 border-[3px] border-ink"></span>{ownName}: {m.place_map_own_outline()}
					</li>
				{/if}
				<li class="inline-flex items-center gap-1.5">
					<span
						class="inline-block size-3 border border-rule-strong"
						style:background-color={NO_SCORE_FILL}
					></span>{m.place_map_no_value()}
				</li>
			</ul>
		</figcaption>
	{/if}
</figure>
