<!--
	Umriss-Karte zur Orientierung: Gebiete nach Kiez-Score eingefärbt (Klassen und Farben des
	Score-Layers), der eigene Ort mit dicker Kontur obenauf. Die Karte ist ein Bild ohne
	Tab-Stopps; die Beschreibung steht als Text daneben, die Werte in den Tabellen der Seite.
-->
<script lang="ts">
	import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
	import {
		NO_SCORE_FILL,
		scoreClassFill
	} from '$lib/components/atlas/internal/score-class-color.js';

	interface Props {
		outline: RegionOutline;
		/** Score je Gebiet; fehlt er, bleibt das Gebiet grau. */
		scores: ReadonlyMap<string, { name: string; composite: number | null }>;
		ownSlug: string | null;
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
		return scoreClassFill(scores.get(id)?.composite ?? null);
	}
	const classes = [
		{ fill: scoreClassFill(10), text: '0 bis 25' },
		{ fill: scoreClassFill(30), text: '26 bis 50' },
		{ fill: scoreClassFill(60), text: '51 bis 75' },
		{ fill: scoreClassFill(90), text: '76 bis 100' },
		{ fill: NO_SCORE_FILL, text: 'ohne Wert' }
	];
</script>

<figure class="m-0 flex flex-col gap-2 {cls}">
	<svg viewBox={outline.viewBox} role="img" aria-label={label} class="block h-auto max-h-72 w-full">
		{#each paths as p (p.id)}
			{@const own = p.id === ownSlug}
			<path
				d={p.d}
				fill={fill(p.id)}
				stroke={own ? 'var(--ink)' : 'var(--bg)'}
				stroke-width={own ? 4 : 1.2}
				stroke-linejoin="round"
				fill-rule="evenodd"
				><title
					>{scores.get(p.id)?.name ?? p.id}{!plain && scores.get(p.id)?.composite != null
						? `: ${Math.round(scores.get(p.id)?.composite ?? 0)} von 100`
						: ''}</title
				></path
			>
		{/each}
	</svg>
	{#if legend && !plain}
		<figcaption>
			<ul class="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-dense-label text-ink-muted">
				<li class="text-ink">Kiez-Score:</li>
				{#each classes as c (c.text)}
					<li class="inline-flex items-center gap-1.5">
						<span
							class="inline-block size-3 border border-rule-strong"
							style:background-color={c.fill}
						></span>{c.text}
					</li>
				{/each}
			</ul>
		</figcaption>
	{/if}
</figure>
