<!--
	Ein Quadrat aus „Berlin in Quadraten“ (#200): eine Wahl in einem Gebiet als Treemap.
	Geometrie, Grau und Zahlen kommen aus `$lib/stories/wahl-quadrate` (`layout`, `derive`,
	`squareElements`). Die Zahlen brauchen die echte Breite und Jost 900, darum erscheinen sie
	erst im Browser. Außenbeschriftungen ragen unter und rechts über das Quadrat hinaus: Wer
	sie zeigt, lässt dort Platz (rund 3 em).
	Bildschirmleser bekommen einen Namen mit den drei größten Parteien und eine Tabelle.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { colorsInOrder } from '$lib/stories/wahl-quadrate/farben';
	import {
		DEFAULT_THRESHOLD,
		derive,
		formatShare,
		sharesOf,
		type Lang
	} from '$lib/stories/wahl-quadrate/grau';
	import { shareTexts } from '$lib/stories/wahl-quadrate/labels';
	import { layout, orderOf, SIDE, type OrderMode } from '$lib/stories/wahl-quadrate/layout';
	import { ORDER, type PartyKey } from '$lib/stories/wahl-quadrate/parteien';
	import { squareElements } from '$lib/stories/wahl-quadrate/svg';
	import type { ElectionShares } from '$lib/stories/wahl-quadrate/types';
	import { sharedMeasure, SQUARE_FONT } from './messen';
	import { partyName } from './namen';

	interface Props {
		readonly election: ElectionShares;
		/** Gebiet und Wahl, z. B. „Mitte, Abgeordnetenhaus 2026“. Name des Bildes und Tabellentitel. */
		readonly title: string;
		/** Parteien darunter fallen ins Grau, 0 bis 1. */
		readonly threshold?: number;
		readonly order?: OrderMode;
		/** Wahlbeteiligung 0 bis 1. Erscheint im Namen und in der Tabelle. */
		readonly turnout?: number | null;
		/** Nichtwähler mitzählen: Quadrat = Wahlberechtigte. Braucht `turnout`. */
		readonly nonVoters?: boolean;
		/** Prozentzahlen in den Blöcken. */
		readonly numbers?: boolean;
		/** Schmale Ansicht: jede Zahl im Block, keine Außenbeschriftung. */
		readonly insideOnly?: boolean;
		readonly highlight?: PartyKey | null;
		readonly hideGrey?: boolean;
	}

	let {
		election,
		title,
		threshold = DEFAULT_THRESHOLD,
		order = 'fixed',
		turnout = null,
		nonVoters = false,
		numbers = true,
		insideOnly = false,
		highlight = null,
		hideGrey = false
	}: Props = $props();

	let width = $state(0);
	let fontVersion = $state(0);

	onMount(() => {
		let alive = true;
		document.fonts?.load(SQUARE_FONT).then(() => {
			if (!alive) return;
			sharedMeasure()?.clear();
			fontVersion++;
		});
		return () => {
			alive = false;
		};
	});

	const lang: Lang = getLocale() === 'en' ? 'en' : 'de';
	const pct = (v: number): string => formatShare(v, lang);
	const PCT_SIGN: Record<Lang, string> = { de: '\u00a0%', en: '%' };

	const derived = $derived(derive(election, threshold));
	const shares = $derived(sharesOf(derived));
	const paper = $derived(nonVoters && turnout != null);
	const blocks = $derived(
		layout(shares, { turnout: paper ? turnout : null, order: orderOf(shares, order) })
	);

	const inner = $derived.by(() => {
		void fontVersion;
		const measure = numbers && width > 0 ? sharedMeasure() : null;
		return squareElements({
			blocks,
			colors: colorsInOrder(),
			title,
			paper,
			highlight,
			hideGrey,
			texts: measure ? shareTexts(shares, lang) : null,
			scale: width / SIDE,
			measure: measure ?? undefined,
			insideOnly
		});
	});

	const label = $derived.by(() => {
		const top = derived.top.map((p) => `${partyName(p.key)} ${pct(p.share)}`).join(', ');
		const t = turnout != null ? ` ${m.bq_turnout()} ${pct(turnout)}.` : '';
		return `${title}: ${top}.${t}`;
	});

	const rows = $derived(
		ORDER.filter((k) => derived.disp[k] > 0).map((k) => ({
			key: k,
			name:
				k === 'rest'
					? m.bq_grey_row({ threshold: `${Math.round(threshold * 100)}${PCT_SIGN[lang]}` })
					: partyName(k),
			share: pct(derived.disp[k])
		}))
	);
</script>

<div class="bq-quadrat" bind:clientWidth={width}>
	<svg
		viewBox="0 0 {SIDE} {SIDE}"
		role="img"
		aria-label={label}
		shape-rendering="crispEdges"
		overflow="visible"
	>
		{@html inner}
	</svg>
	<table class="sr-only">
		<caption>{title}</caption>
		<thead>
			<tr><th scope="col">{m.bq_table_party()}</th><th scope="col">{m.bq_table_share()}</th></tr>
		</thead>
		<tbody>
			{#each rows as row (row.key)}
				<tr><th scope="row">{row.name}</th><td>{row.share}</td></tr>
			{/each}
			{#if turnout != null}
				<tr><th scope="row">{m.bq_turnout()}</th><td>{pct(turnout)}</td></tr>
			{/if}
		</tbody>
	</table>
</div>

<style>
	.bq-quadrat {
		position: relative;
		width: 100%;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 1;
		overflow: visible;
	}
</style>
