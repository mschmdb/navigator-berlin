<!--
	Wahl-Teaser auf der Home-Landing. Drei Schnell-Links auf die jüngsten
	Wahlen plus Verweis auf /wahl-Übersicht und Methodik.
	Screenshot-Slot bereit für spätere Browser-Capture-Pipeline analog
	HomeHook.
-->
<script lang="ts">
	import { Vote } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import {
		wahlReiheLabel,
		wahlTypLabel,
		wahlStimmtypLabel,
		wahlVorlaeufigLabel,
		sourceDisplayLabel,
		type WahlTyp,
		type WahlStimmtyp
	} from '$lib/data/wahl-labels.js';
	import { buildWahlFallbackList } from '$lib/data/wahl-slug.js';

	interface Props {
		/** Gesamtzahl aller Wahlen für den Übersichtslink (i18n Block B2
		 * Review-Fund: war hardcoded `23`). Default nur für Standalone-Nutzung
		 * (Tests/Storybook) -- die Startseite übergibt immer den echten,
		 * server-geladenen Wert (`+page.server.ts`, DB oder Fallback-Liste). */
		readonly wahlCount?: number;
	}
	const { wahlCount = buildWahlFallbackList().length }: Props = $props();

	type WahlCardSource = {
		readonly slug: string;
		readonly typ: WahlTyp;
		/** true: Kartentitel nur das kurze Institutions-Label (Reihe) + Jahr,
		 * ohne "-wahl"/"election"-Suffix (matcht das DE-Alt-Verhalten). */
		readonly reiheOnly: boolean;
		readonly jahr: string;
		readonly stimmtyp: WahlStimmtyp;
		readonly vorlaeufig: boolean;
		readonly quelle: string;
	};

	// `vorlaeufig` ist statische Config, kein API-Feld: ein Re-Ingest mit dem
	// Endergebnis setzt es NICHT automatisch zurück. Bei einer neuen Wahl mit
	// vorläufigem Ergebnis hier auf true setzen und beim Endergebnis von Hand
	// zurücknehmen (Re-Ingest-Checkliste in docs/wahldaten-methodik.md).
	const CARDS: ReadonlyArray<WahlCardSource> = [
		{
			slug: '2026-agh-zweitstimme',
			typ: 'agh',
			reiheOnly: true,
			jahr: '2026',
			stimmtyp: 'zweitstimme',
			vorlaeufig: false,
			quelle: 'Landeswahlleiterin Berlin'
		},
		{
			slug: '2026-bvv',
			typ: 'bvv',
			reiheOnly: false,
			jahr: '2026',
			stimmtyp: 'einstimme',
			vorlaeufig: false,
			quelle: 'Landeswahlleiterin Berlin'
		},
		{
			slug: '2025-btw-zweitstimme',
			typ: 'btw',
			reiheOnly: false,
			jahr: '2025',
			stimmtyp: 'zweitstimme',
			vorlaeufig: false,
			quelle: 'Bundeswahlleiterin'
		}
	];

	const cards = $derived(
		CARDS.map((card) => ({
			slug: card.slug,
			title: `${card.reiheOnly ? wahlReiheLabel(card.typ) : wahlTypLabel(card.typ)} ${card.jahr}`,
			typLabel: card.vorlaeufig
				? `${wahlStimmtypLabel(card.stimmtyp)}, ${wahlVorlaeufigLabel()}`
				: wahlStimmtypLabel(card.stimmtyp),
			note: m.home_wahl_teaser_quelle_label({ source: sourceDisplayLabel(card.quelle) })
		}))
	);
</script>

<section data-testid="home-wahl-teaser" class="space-y-6">
	<header class="space-y-2">
		<h2 class="text-2xl font-bold text-ink md:text-3xl">{m.home_wahl_heading()}</h2>
		<p class="text-base text-ink-muted">
			{m.home_wahl_lead()}
		</p>
	</header>

	<ul class="grid gap-4 sm:grid-cols-3">
		{#each cards as card (card.slug)}
			<li class="rounded border border-rule p-4">
				<a
					href={localizedHref(`/berlin-wahlen/${card.slug}`)}
					data-testid={`home-wahl-card-${card.slug}`}
					class="flex flex-col gap-2 text-ink hover:text-accent"
				>
					<span class="flex items-center gap-2">
						<Vote size={16} aria-hidden="true" />
						<span class="text-xs">
							{card.typLabel}
						</span>
					</span>
					<span class="text-lg leading-snug">{card.title}</span>
					<span class="text-xs text-ink-muted">{card.note}</span>
				</a>
			</li>
		{/each}
	</ul>

	<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
		<a
			href={localizedHref('/berlin-wahlen')}
			data-testid="home-wahl-teaser-all"
			class="inline-flex min-h-(--target-min) items-center gap-2 text-sm text-accent hover:text-ink"
		>
			{(wahlCount === 1 ? m.home_wahl_all_link_singular : m.home_wahl_all_link_plural)({
				count: wahlCount
			})}
		</a>
		<a
			href={localizedHref('/methodik/wahldaten')}
			data-testid="home-wahl-teaser-methodik"
			class="inline-flex min-h-(--target-min) items-center text-sm text-ink-muted hover:text-ink"
		>
			{m.wahl_detail_methodik_link_label()}
		</a>
	</div>
</section>
