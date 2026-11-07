<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import AlleBezirke from '$lib/components/stories/quadrate/alle-bezirke.svelte';
	import PlakatDownload from '$lib/components/stories/quadrate/plakat-download.svelte';
	import { toHandbuchDaten } from '$lib/stories/wahl-quadrate/handbuch-daten';
	import type { StoriesWahlData } from '$lib/stories/wahl-quadrate/types';
	import { DEFAULT_URL_STATE, type ZeitState } from '$lib/stories/wahl-quadrate/url-state';
	import { STORY_FONT } from '$lib/stories/tokens';
	import KapitelNichtwaehler from './kapitel-nichtwaehler.svelte';
	import KapitelReihenfolge from './kapitel-reihenfolge.svelte';
	import KapitelSchwelle from './kapitel-schwelle.svelte';
	import KapitelZeit from './kapitel-zeit.svelte';
	import Karte from './karte.svelte';
	import Legende from './legende.svelte';
	import { typName } from './texte';

	export interface HandbuchSection {
		readonly id: string | null;
		readonly heading: string | null;
		readonly html: string;
	}

	interface Props {
		readonly title: string;
		readonly date: string;
		readonly dateLabel: string;
		readonly sections: readonly HandbuchSection[];
		readonly daten: StoriesWahlData;
		/** Bezirk und Wahl in Kapitel 5, aus der URL. */
		readonly zeit?: ZeitState;
		readonly onzeit?: (zeit: ZeitState) => void;
		/** `de`, wenn Titel oder Text auf der englischen Seite deutsch bleiben. */
		readonly titleLang?: string;
		readonly bodyLang?: string;
	}

	let {
		title,
		date,
		dateLabel,
		sections,
		daten,
		zeit = DEFAULT_URL_STATE.zeit,
		onzeit,
		titleLang,
		bodyLang
	}: Props = $props();

	const intro = $derived(sections.find((s) => s.id === null));
	const chapters = $derived(sections.filter((s) => s.id !== null));
	const kurz = $derived(toHandbuchDaten(daten));
	const start = $derived(
		kurz.bezirke.find((b) => b.slug === DEFAULT_URL_STATE.zeit.bezirk) ?? kurz.bezirke[0]
	);

	function nummer(id: string | null): number | null {
		const match = /^s([1-6])$/.exec(id ?? '');
		return match ? Number(match[1]) : null;
	}
</script>

<!--
	Handbuch „Berlin in Quadraten“ (#190). Der Text kommt als Abschnitte aus dem Markdown,
	getrennt durch Marker „abschnitt: id“ im HTML-Kommentar. Die Seite stellt je Kapitel s1 bis s6
	das passende Beispiel darunter. Aufbau nach runde-20-ux: eine linke Kante, Kapitel durch eine
	Linie getrennt, links Nummer und Titel, rechts Text, darunter das Beispiel mit seinen
	Steuerelementen direkt darüber.
-->

<div class="hb" style:--hb-font={STORY_FONT} style:--bq-sticky-top="var(--header-height, 72px)">
	<header class="hb-head">
		<p class="hb-series">{m.stories_index_h1()}</p>
		<h1 data-testid="stories-detail-title" lang={titleLang}>{title}</h1>
		<p class="hb-date"><time datetime={date}>{dateLabel}</time></p>
		{#if intro}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- Markdown aus _content, serverseitig durch sanitizeHtml -->
			<div class="hb-lead" lang={bodyLang}>{@html intro.html}</div>
		{/if}
	</header>

	{#each chapters as s (s.id)}
		{@const n = nummer(s.id)}
		<section
			class="ch"
			class:wide={n === 5 || n === 6}
			id={s.id}
			aria-labelledby={s.heading ? `hb-t-${s.id}` : undefined}
		>
			{#if s.heading}
				<h2 class="ch-h" id="hb-t-{s.id}">
					{#if n}<span class="n" aria-hidden="true">{n}</span>{/if}{s.heading}
				</h2>
			{/if}
			<div class="ch-t" class:look={s.id === 'hinschauen'} lang={bodyLang}>
				{#if s.id === 'quellen'}<Legende />{/if}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- Markdown aus _content, serverseitig durch sanitizeHtml -->
				{@html s.html}
			</div>
			{#if n === 1}
				<div
					class="fig"
					role="group"
					aria-label={m.bq_hb_fig_ch1({ name: `${start.name}, ${typName('agh')} 2026` })}
				>
					<div class="hb-stage">
						<Karte name={start.name} typ="agh" jahr={2026} ergebnis={start.wahlen.agh26} />
					</div>
				</div>
			{:else if n === 2}
				<div class="fig" role="group" aria-label={m.bq_hb_fig_schwelle()}>
					<KapitelSchwelle bezirk={start} />
				</div>
			{:else if n === 3}
				<div class="fig" role="group" aria-label={m.bq_hb_fig_reihenfolge()}>
					<KapitelReihenfolge bezirk={start} />
				</div>
			{:else if n === 4}
				<div class="fig" role="group" aria-label={m.bq_hb_fig_nichtwaehler()}>
					<KapitelNichtwaehler bezirk={start} />
				</div>
			{:else if n === 5}
				<div class="fig" role="group" aria-label={m.bq_hb_fig_zeit()}>
					<KapitelZeit daten={kurz} {zeit} {onzeit} />
				</div>
			{:else if n === 6}
				<div class="fig">
					<AlleBezirke data={daten} />
					<!-- Plakate wie bei „Punkt, Linie, Kiez“: Vektor-PDF je Sprache und Wahlart (#192). -->
					<p class="hb-plakate">
						<PlakatDownload typ="agh" />
						<PlakatDownload typ="btw" />
					</p>
				</div>
			{/if}
		</section>
	{/each}
</div>

<style>
	.hb {
		/* Site-Tokens aus app.css: Der Beitrag steht direkt auf dem Seitenhintergrund. */
		--hb-ink: var(--color-ink, #141414);
		--hb-muted: var(--color-ink-muted, #4a4a46);
		--hb-focus: var(--focus, #0030c8);
		--hb-s1: 8px;
		--hb-s2: 16px;
		--hb-s3: 24px;
		--hb-s4: 40px;
		--hb-s5: 72px;
		--hb-s6: 120px;
		color: var(--hb-ink);
		font: 400 17px/1.45 var(--hb-font);
	}
	.hb :global(a) {
		color: var(--hb-ink);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.hb :global(a:focus-visible) {
		outline: 3px solid var(--hb-focus);
		outline-offset: 2px;
	}
	.hb-head {
		padding: var(--hb-s4) 0 var(--hb-s5);
	}
	.hb-series {
		font-weight: 600;
		font-size: 16px;
		margin: 0 0 var(--hb-s2);
		color: var(--hb-muted);
	}
	h1 {
		font-weight: 900;
		letter-spacing: -0.045em;
		line-height: 0.88;
		font-size: clamp(48px, 8vw, 104px);
		margin: 0 0 var(--hb-s2);
	}
	.hb-date {
		margin: 0 0 var(--hb-s3);
		font-size: 15px;
		color: var(--hb-muted);
	}
	.hb-lead :global(p) {
		font-size: clamp(18px, 1.6vw, 22px);
		line-height: 1.45;
		max-width: 42ch;
		margin: 0 0 var(--hb-s4);
	}
	.hb-lead :global(ol) {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--hb-ink);
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		counter-reset: hb-toc;
	}
	.hb-lead :global(li) {
		border-bottom: 1px solid var(--hb-ink);
		counter-increment: hb-toc;
	}
	.hb-lead :global(a) {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 48px;
		text-decoration: none;
		font-weight: 600;
	}
	.hb-lead :global(a:hover) {
		text-decoration: underline;
	}
	.hb-lead :global(a)::before {
		content: counter(hb-toc);
		content: counter(hb-toc) / '';
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: var(--hb-muted);
		min-width: 1.2em;
	}
	.ch {
		display: grid;
		grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
		column-gap: var(--hb-s4);
		border-top: 1px solid var(--hb-ink);
		padding: var(--hb-s4) 0 var(--hb-s6);
		scroll-margin-top: calc(var(--header-height, 72px) + var(--hb-s3));
	}
	.ch-h {
		grid-column: 1;
		margin: 0;
		font-size: clamp(30px, 2.8vw, 38px);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.1;
		display: flex;
		gap: 12px;
		align-items: baseline;
	}
	.n {
		font-weight: 900;
		font-variant-numeric: tabular-nums;
		color: var(--hb-muted);
		min-width: 1.1em;
	}
	.ch-t {
		grid-column: 2;
		min-width: 0;
	}
	.ch-t :global(p) {
		margin: 0 0 var(--hb-s2);
		max-width: 60ch;
	}
	.ch-t :global(ul:not(.legend)) {
		list-style: disc;
		padding-left: 20px;
		margin: 0;
		font-size: 15px;
		max-width: 70ch;
	}
	.ch-t :global(ul:not(.legend) li) {
		margin: 4px 0;
	}
	.look :global(ul:not(.legend)) {
		list-style: none;
		padding: 0;
		font-size: inherit;
		max-width: 62ch;
	}
	.look :global(ul:not(.legend) li) {
		margin: 0;
		padding: var(--hb-s2) 0;
		border-bottom: 1px solid var(--hb-ink);
	}
	.look :global(ul:not(.legend) li:first-child) {
		padding-top: 0;
	}
	.look :global(ul:not(.legend) li:last-child) {
		border-bottom: 0;
		padding-bottom: 0;
	}
	.look :global(a) {
		display: inline-block;
		min-height: 24px;
	}
	.fig {
		grid-column: 2;
		min-width: 0;
		margin-top: var(--hb-s3);
	}
	.wide .fig {
		grid-column: 1 / -1;
		margin-top: var(--hb-s4);
	}
	.fig :global(.hb-ctls) {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--hb-s2) var(--hb-s3);
		margin: 0 0 var(--hb-s3);
	}
	.fig :global(.hb-stage) {
		display: flex;
		flex-wrap: wrap;
		gap: var(--hb-s4) var(--hb-s5);
		align-items: flex-start;
	}
	.hb-plakate {
		display: flex;
		flex-wrap: wrap;
		gap: var(--hb-s2);
		margin: var(--hb-s4) 0 0;
	}
	@media (max-width: 899px) {
		.ch {
			grid-template-columns: minmax(0, 1fr);
			padding: var(--hb-s3) 0 var(--hb-s5);
		}
		.ch-h,
		.ch-t,
		.fig,
		.wide .fig {
			grid-column: 1;
		}
		.ch-h {
			margin-bottom: var(--hb-s2);
		}
		.fig :global(.hb-stage) {
			gap: var(--hb-s3);
		}
	}
	@media (max-width: 640px) {
		h1 {
			font-size: 56px;
		}
		.ch-h {
			font-size: 38px;
			line-height: 1.05;
		}
		.fig :global(.hb-ctls) {
			gap: var(--hb-s2);
		}
	}
</style>
