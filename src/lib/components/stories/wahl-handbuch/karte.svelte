<!--
	Karte im Handbuch (#190): ein Quadrat, darunter Jahr, Bezirk und Wahl, Wahlbeteiligung und
	die Grau-Zeile. Mit `fixed` (Kapitel 5) haben Name und Zeilen feste Höhen, damit wechselnde
	Texte nichts darunter verschieben.
-->
<script lang="ts">
	import { Quadrat, greyNames } from '$lib/components/stories/quadrate';
	import { derive, formatGreyLine } from '$lib/stories/wahl-quadrate/grau';
	import type { HandbuchErgebnis } from '$lib/stories/wahl-quadrate/handbuch-daten';
	import type { OrderMode } from '$lib/stories/wahl-quadrate/layout';
	import type { WahlTyp } from '$lib/stories/wahl-quadrate/parteien';
	import type { ElectionShares } from '$lib/stories/wahl-quadrate/types';
	import { lang, turnoutLine, typName } from './texte';

	interface Props {
		readonly name: string;
		readonly typ: WahlTyp;
		readonly jahr: number;
		readonly ergebnis: HandbuchErgebnis;
		readonly threshold?: number;
		readonly order?: OrderMode;
		readonly nonVoters?: boolean;
		readonly morph?: { from: ElectionShares; to: ElectionShares; t: number } | null;
		readonly fixed?: boolean;
	}

	let {
		name,
		typ,
		jahr,
		ergebnis,
		threshold = 0.05,
		order = 'fixed',
		nonVoters = false,
		morph = null,
		fixed = false
	}: Props = $props();

	const who = $derived(`${name}, ${typName(typ)}`);
	const grey = $derived(formatGreyLine(derive(ergebnis.e, threshold), greyNames(), lang()));
</script>

<figure class="hb-card" class:fixed>
	<div class="sq">
		<Quadrat
			election={ergebnis.e}
			title="{who} {jahr}"
			{threshold}
			{order}
			turnout={ergebnis.turnout}
			{nonVoters}
			{morph}
		/>
	</div>
	<figcaption>
		<span class="yr">{jahr}</span>
		<span class="who">{who}</span>
		<span class="c1">{turnoutLine(ergebnis.turnout)}</span>
		<span class="c2" data-testid="hb-grey">{grey}</span>
	</figcaption>
</figure>

<style>
	.hb-card {
		margin: 0;
		width: min(100%, 400px);
		container-type: inline-size;
	}
	.sq {
		/* Platz für Außenbeschriftungen unter und rechts neben dem Quadrat. */
		margin: 20px 44px 36px 0;
	}
	figcaption {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 14px;
		line-height: 1.35;
		color: var(--hb-muted);
	}
	.yr {
		font-weight: 900;
		font-size: clamp(40px, 18cqw, 72px);
		letter-spacing: -0.03em;
		line-height: 0.9;
		color: var(--hb-ink);
		font-variant-numeric: tabular-nums;
		margin-bottom: 8px;
	}
	.who {
		font-weight: 600;
		color: var(--hb-ink);
	}
	.c2 {
		min-height: 2.7em;
	}
	.fixed {
		width: 100%;
	}
	.fixed .who {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.fixed .c1 {
		min-height: 1.35em;
	}
	.fixed .c2 {
		min-height: 4.05em;
	}
</style>
