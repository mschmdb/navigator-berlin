<!--
	Interne Demo (#200): Quadrat und Steuerelemente von „Berlin in Quadraten“ für die
	Design-Prüfung. Kein Inhalt für Leser, /demo ist noindex.
-->
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import {
		Auswahl,
		Knopf,
		Quadrat,
		Regler,
		Schalter,
		Segmente,
		greyNames
	} from '$lib/components/stories/quadrate';
	import { toElectionShares } from '$lib/stories/wahl-quadrate/eingabe';
	import { derive, formatGreyLine } from '$lib/stories/wahl-quadrate/grau';
	import type { OrderMode } from '$lib/stories/wahl-quadrate/layout';
	import type { WahlTyp } from '$lib/stories/wahl-quadrate/parteien';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const stories = $derived(data.data);

	const START = { bezirk: '02', typ: 'agh' as WahlTyp, schwelle: 5, papier: false, zahlen: true };
	let bezirk = $state(START.bezirk);
	let typ = $state<WahlTyp>(START.typ);
	let reihenfolge = $state<OrderMode>('fixed');
	let schwelle = $state(START.schwelle);
	let papier = $state(START.papier);
	let zahlen = $state(START.zahlen);

	const narrow = new MediaQuery('max-width: 640px');
	const TYP_NAME: Record<WahlTyp, string> = { agh: 'Abgeordnetenhaus', btw: 'Bundestag' };

	const gebiet = $derived(stories.bezirke.find((b) => b.nr === bezirk) ?? stories.bezirke[0]);
	const wahlen = $derived(stories.wahlen.filter((w) => w.typ === typ));

	function reset(): void {
		bezirk = START.bezirk;
		typ = START.typ;
		reihenfolge = 'fixed';
		schwelle = START.schwelle;
		papier = START.papier;
		zahlen = START.zahlen;
	}
</script>

<svelte:head>
	<title>Demo: Berlin in Quadraten, Bausteine</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="demo">
	<h1>Berlin in Quadraten: Bausteine</h1>

	<div class="ctls">
		<Auswahl
			label="Bezirk"
			items={stories.bezirke.map((b) => ({ value: b.nr, text: `${b.nr} ${b.name}` }))}
			bind:value={bezirk}
		/>
		<Segmente
			label="Wahl"
			items={[
				{ value: 'agh', text: 'Abgeordnetenhaus' },
				{ value: 'btw', text: 'Bundestag' }
			]}
			bind:value={typ}
		/>
		<Segmente
			label="Parteien"
			items={[
				{ value: 'fixed', text: 'Feste Plätze' },
				{ value: 'size', text: 'Nach Größe', help: 'Größte Partei zuerst, Grau bleibt zuletzt.' }
			]}
			bind:value={reihenfolge}
		/>
		<Regler
			label="Schwelle für Grau"
			min={0}
			max={10}
			bind:value={schwelle}
			format={(v) => `${v}\u00a0%`}
			help="Parteien unter diesem Anteil fallen ins Grau."
		/>
		<Schalter
			label="Nichtwähler"
			text="Mitzählen"
			bind:pressed={papier}
			help="Das Quadrat steht für alle Wahlberechtigten. Die Fläche rechts bleibt frei."
		/>
		<Schalter label="Prozentzahlen" text="Zeigen" bind:pressed={zahlen} />
		<div class="reset">
			<Knopf text="Zurücksetzen" help="Stellt alle Einstellungen auf den Anfang." onclick={reset} />
		</div>
	</div>

	<ol class="series" aria-label="{gebiet.name}, {TYP_NAME[typ]}">
		{#each wahlen as w (w.slug)}
			{@const zahlenWahl = gebiet.wahlen[w.slug]}
			{@const e = toElectionShares(zahlenWahl)}
			<li>
				<figure>
					<Quadrat
						election={e}
						title="{gebiet.name}, {TYP_NAME[typ]} {w.jahr}"
						threshold={schwelle / 100}
						order={reihenfolge}
						turnout={zahlenWahl.wahlbeteiligung}
						nonVoters={papier}
						numbers={zahlen}
						insideOnly={narrow.current}
					/>
					<figcaption>
						<span class="yr" aria-hidden="true">{w.jahr}</span>
						<span class="grey">{formatGreyLine(derive(e, schwelle / 100), greyNames(), 'de')}</span>
					</figcaption>
				</figure>
			</li>
		{/each}
	</ol>
</main>

<style>
	.demo {
		background: #efe6d2;
		color: #26221e;
		font-family: Jost, system-ui, sans-serif;
		padding: 40px clamp(16px, 4vw, 72px) 120px;
		min-height: 100vh;
	}
	h1 {
		font-weight: 900;
		font-size: clamp(36px, 6vw, 56px);
		line-height: 1.05;
		margin: 0 0 40px;
	}
	.ctls {
		display: grid;
		grid-template-columns: repeat(3, max-content);
		gap: 24px 40px;
		align-items: end;
		margin: 0 0 40px;
	}
	.series {
		list-style: none;
		padding: 0 52px 0 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 48px 64px;
		max-width: 1100px;
	}
	figure {
		margin: 0;
	}
	figcaption {
		margin-top: 56px;
	}
	.yr {
		display: block;
		font-weight: 900;
		font-size: 28px;
	}
	.grey {
		display: block;
		font-size: 14px;
		line-height: 1.35;
		margin-top: 4px;
	}
	@media (max-width: 899px) {
		.ctls {
			grid-template-columns: repeat(2, max-content);
		}
	}
	@media (max-width: 640px) {
		.ctls {
			grid-template-columns: minmax(0, 1fr);
		}
		.series {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			padding: 0;
			gap: 32px 24px;
		}
		figcaption {
			margin-top: 8px;
		}
	}
</style>
