<!--
	Umriss-Karte zur Orientierung: Gebiete nach Kiez-Score eingefärbt (Klassen und Farben des
	Score-Layers), der eigene Ort mit dicker Kontur obenauf. Die Karte ist ein Bild ohne
	Tab-Stopps; die Beschreibung steht als Text daneben, die Werte in den Tabellen der Seite.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
	import { NO_SCORE_FILL } from '$lib/components/atlas/internal/score-class-color.js';
	import { PLACE_MAP_FILLS, placeMapFill } from '$lib/place/map-classes';

	interface Props {
		outline: RegionOutline;
		/** Score je Gebiet; fehlt er, bleibt das Gebiet grau. */
		scores: ReadonlyMap<string, { name: string; composite: number | null }>;
		ownSlug: string | null;
		/** Name des eigenen Orts für die Legende („Reuterstraße: dick umrandet“). */
		ownName?: string | null;
		/** Ohne Score-Farben: alle Gebiete hell, nur der eigene dunkel (Lage-Kärtchen). */
		plain?: boolean;
		label: string;
		legend?: boolean;
		class?: string;
	}
	let {
		outline,
		scores,
		ownSlug,
		ownName = null,
		plain = false,
		label,
		legend = true,
		class: cls = ''
	}: Props = $props();

	const paths = $derived(
		[...outline.paths].sort((a, b) => Number(a.id === ownSlug) - Number(b.id === ownSlug))
	);
	function fill(id: string): string {
		if (plain) return id === ownSlug ? 'var(--ink)' : 'var(--bg-muted)';
		return placeMapFill(scores.get(id)?.composite ?? null);
	}
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
	<svg viewBox={outline.viewBox} role="img" aria-label={label} class="block h-auto max-h-72 w-full">
		{#each paths as p (p.id)}
			{@const own = p.id === ownSlug}
			<path
				d={p.d}
				fill={fill(p.id)}
				stroke={own ? 'var(--ink)' : '#ffffff'}
				stroke-width={own ? 4 : 1.2}
				stroke-linejoin="round"
				fill-rule="evenodd"
				><title
					>{!plain && scores.get(p.id)?.composite != null
						? m.place_map_title_value({
								name: scores.get(p.id)?.name ?? p.id,
								score: Math.round(scores.get(p.id)?.composite ?? 0)
							})
						: (scores.get(p.id)?.name ?? p.id)}</title
				></path
			>
		{/each}
	</svg>
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
				{#if ownName && ownSlug}
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
