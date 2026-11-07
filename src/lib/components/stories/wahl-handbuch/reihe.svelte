<!-- Alle Wahlen eines Bezirks nebeneinander (Kapitel 5, #190), mit Jahr und Grau-Zeile. -->
<script lang="ts">
	import { Quadrat, greyNames } from '$lib/components/stories/quadrate';
	import { derive, formatGreyLine } from '$lib/stories/wahl-quadrate/grau';
	import type { HandbuchBezirk, HandbuchWahl } from '$lib/stories/wahl-quadrate/handbuch-daten';
	import type { OrderMode } from '$lib/stories/wahl-quadrate/layout';
	import { lang, turnoutLine, typName } from './texte';

	interface Props {
		readonly bezirk: HandbuchBezirk;
		readonly wahlen: readonly HandbuchWahl[];
		readonly order: OrderMode;
	}

	let { bezirk, wahlen, order }: Props = $props();
</script>

<ol
	class="hb-series"
	style:--n={wahlen.length}
	aria-label="{bezirk.name}, {typName(wahlen[0].typ)}"
>
	{#each wahlen as w (w.slug)}
		{@const ergebnis = bezirk.wahlen[w.slug]}
		<li>
			<figure>
				<Quadrat
					election={ergebnis.e}
					title="{bezirk.name}, {typName(w.typ)} {w.jahr}"
					{order}
					turnout={ergebnis.turnout}
				/>
				<figcaption>
					<span class="yr">{w.jahr}</span>
					<span>{turnoutLine(ergebnis.turnout)}</span>
					<span data-testid="hb-grey">
						{formatGreyLine(derive(ergebnis.e), greyNames(), lang())}
					</span>
				</figcaption>
			</figure>
		</li>
	{/each}
</ol>

<style>
	.hb-series {
		list-style: none;
		margin: 0;
		padding: 0 52px 0 0;
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		column-gap: clamp(40px, 5vw, 64px);
		row-gap: var(--hb-s4);
		max-width: 1100px;
	}
	figure {
		margin: 0;
		container-type: inline-size;
	}
	figcaption {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-top: 48px;
		font-size: 14px;
		line-height: 1.3;
		color: var(--hb-muted);
	}
	.yr {
		font-weight: 900;
		font-size: 36cqw;
		letter-spacing: -0.03em;
		line-height: 0.9;
		color: var(--hb-ink);
		font-variant-numeric: tabular-nums;
		margin-bottom: 6px;
	}
	@media (max-width: 640px) {
		.hb-series {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
