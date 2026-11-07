<!--
	„Alle Bezirke, alle Wahlen“ (#191): 12 Bezirke mal alle Wahlen einer Art, nach
	runde-20-ux/src/wall.js und regeln.md Runde 20b/20c. Kapitel 6 der Beitragsseite (#190).
	Der Zustand steht in der URL (`url-state.ts`, z. B. `?hl=piraten#s6`). Die Komponente liest
	ihn nach dem Mounten, damit sie auch auf vorgerenderten Seiten den Deep-Link trifft.
	Unter 640 px Breite: kein Seitwärts-Scrollen, Name über der Reihe, Zahlen nur im Block.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import {
		bezirkAn,
		sichtbareJahre,
		sortiereBezirke,
		wahlTypen,
		wandMasse
	} from '$lib/stories/wahl-quadrate/gesamt';
	import type { WahlTyp } from '$lib/stories/wahl-quadrate/parteien';
	import type { StoriesWahlData } from '$lib/stories/wahl-quadrate/types';
	import {
		DEFAULT_URL_STATE,
		parseUrlState,
		serializeUrlState,
		type GesamtState
	} from '$lib/stories/wahl-quadrate/url-state';
	import Grau from './alle-bezirke-grau.svelte';
	import Raster from './alle-bezirke-raster.svelte';
	import Steuerung from './alle-bezirke-steuerung.svelte';
	import Tabelle from './alle-bezirke-tabelle.svelte';
	import './alle-bezirke.css';
	import './steuerung.css';

	interface Props {
		readonly data: StoriesWahlData;
		/** Aktuelle URL. Standard: Adresse des Fensters. */
		readonly readUrl?: () => URL;
		/** Schreibt die neue Adresse. Standard: SvelteKit `replaceState`. */
		readonly writeUrl?: (href: string) => void;
	}

	let {
		data,
		readUrl = () => new URL(window.location.href),
		// Gleiche Seite, nur Suchparameter und Hash ändern sich: kein resolve() nötig.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		writeUrl = (href: string) => replaceState(href, page.state)
	}: Props = $props();

	/** Unter dieser Breite des Rasters gilt die schmale Ansicht. */
	const SCHMAL_UNTER = 640;
	/** Breite vor der ersten Messung (Server, erster Frame). */
	const BREITE_VORAB = 1200;

	let s = $state<GesamtState>(DEFAULT_URL_STATE.gesamt);
	let breite = $state(0);
	let box = $state<HTMLDivElement>();
	let fade = $state(false);

	onMount(() => {
		s = parseUrlState(readUrl()).gesamt;
	});

	function commit(next: GesamtState): void {
		s = next;
		const url = readUrl();
		const { search } = serializeUrlState({ ...parseUrlState(url), gesamt: next }, url.searchParams);
		writeUrl(url.pathname + search + url.hash);
	}

	const typNamen = $derived<Record<WahlTyp, string>>({
		agh: m.bq_all_wahl_agh(),
		btw: m.bq_all_wahl_btw()
	});
	const typen = $derived(wahlTypen(s.wahl));
	const sortiert = $derived(sortiereBezirke(data.bezirke, s));
	const alleNr = $derived(data.bezirke.map((b) => b.nr));
	const schmal = $derived(breite > 0 && breite < SCHMAL_UNTER);
	const masse = $derived(wandMasse(breite || BREITE_VORAB, schmal, s));
	const keineBezirke = $derived(!alleNr.some((nr) => bezirkAn(s, nr)));
	const keineWahlen = $derived(typen.every((t) => sichtbareJahre(s, t).length === 0));

	function hint(): void {
		if (!box) return;
		fade = masse.scrollt && box.scrollLeft + box.clientWidth < box.scrollWidth - 2;
	}

	$effect(() => {
		void masse.scrollt;
		void breite;
		hint();
	});
</script>

<div class="bq-wall" class:narrow={schmal}>
	<Steuerung state={s} onchange={commit} />

	<div class="bq-wrap" class:fade>
		<!-- Scrollt das Raster seitwärts, braucht es Tastaturzugang (WCAG 2.1.1). -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="bq-wbox"
			class:scrolls={masse.scrollt}
			role="region"
			aria-label={masse.scrollt ? m.bq_all_region_scroll() : m.bq_all_region()}
			tabindex={masse.scrollt ? 0 : undefined}
			bind:this={box}
			bind:clientWidth={breite}
			onscroll={hint}
			style:--bq-sq="{masse.quadrat}px"
			style:--bq-gap="{masse.abstand}px"
			style:--bq-off="{masse.aus}px"
		>
			{#if keineBezirke || keineWahlen}
				<p class="bq-empty">
					{keineBezirke ? m.bq_all_empty_districts() : m.bq_all_empty_elections()}
				</p>
			{/if}
			{#each typen as typ (typ)}
				<Raster
					{typ}
					typName={typNamen[typ]}
					state={s}
					bezirke={sortiert}
					{alleNr}
					{schmal}
					titel={typen.length > 1}
					onchange={commit}
				/>
			{/each}
		</div>
	</div>

	<Grau {data} state={s} {typNamen} />
	<Tabelle state={s} bezirke={sortiert} {typNamen} />
</div>
