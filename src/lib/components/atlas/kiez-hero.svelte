<!--
	Story 2.4 T3: KiezHero-Long-Form-Layout.

	Spiegelt das Bezirks-Hero-Pattern (Story 2.3): H1 (Plex-Serif) + parent-
	Bezirk-Subline, Lead-Absatz mit Einwohner-/Flächen-Daten, Kiez-Score-
	Summary aus Story 2.9a (composite + 4 Dimensionen Ruhe/Grün/Mobilität/
	Versorgung; Soziale-Lage off per Stigma-Schutz), Steckbrief-Tabelle aus
	`kiez_stats` (Story 2.0), FAQ-Section aus `faq_qna` (Story 2.5b).

	Kein Karten-Embed analog Bezirks-Page (User-Decision 2026-05-16: trägt
	auf Detail-Seite keinen Mehrwert; OG-Card via Story 2.6 deckt visuelles
	Sharing-Bedürfnis ab).

	Sections rendern Placeholder wenn `stats === null` oder `score === null`
	(DATABASE_URL fehlt im Build oder Story-2.0/2.9a-Aggregat noch nicht
	gelaufen).
-->
<script lang="ts">
	import type { KiezProfile, FaqEntry } from '$lib/data/types.js';
	import type { InferSelectModel } from 'drizzle-orm';
	import type { kiezStats } from '$lib/server/db/schema/index.js';
	import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';
	import FaqSection from './faq-section.svelte';
	import { describeLaermCategoryDe } from '$lib/data/faq-helpers/laerm.js';
	import { describeGruenversorgungDe } from '$lib/data/faq-helpers/gruen.js';
	import { describeWohnlageDe, mssBeschreibungDe } from '$lib/data/faq-helpers/wohnen.js';
	import { describeOepnvDichte, formatStopsPerKm2 } from '$lib/data/faq-helpers/oepnv.js';
	import { describePetKategorie, formatPet } from '$lib/data/faq-helpers/klima.js';

	type KiezStatsRow = InferSelectModel<typeof kiezStats>;

	interface Props {
		readonly profile: KiezProfile;
		readonly stats: KiezStatsRow | null;
		readonly score: KiezScore | null;
		readonly faq: readonly FaqEntry[];
	}

	const { profile, stats, score, faq }: Props = $props();

	const numberDe = new Intl.NumberFormat('de-DE');
	const leadText = $derived.by(() => {
		const parts: string[] = [`Kiez ${profile.name}`];
		if (profile.bezirk.length > 0) parts.push(`Bezirk ${profile.bezirk}`);
		if (profile.einwohner > 0) parts.push(`${numberDe.format(profile.einwohner)} Einwohner:innen`);
		if (profile.flaecheHa > 0) parts.push(`${numberDe.format(profile.flaecheHa)} ha`);
		return `${parts.join(', ')}. Daten zu Wohnen, Umwelt, Klima und Mobilität auf dieser Seite.`;
	});

	interface SteckbriefRow {
		readonly cluster: string;
		readonly value: string;
		readonly source: string;
		readonly sourceUpdatedAt: string;
	}

	function formatStand(iso: string): string {
		const date = new Date(iso);
		if (isNaN(date.getTime())) return iso;
		return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
	}

	function buildSteckbrief(row: KiezStatsRow): SteckbriefRow[] {
		const out: SteckbriefRow[] = [];
		if (row.laerm.dominantCategory) {
			const raw =
				typeof row.laerm.dominantCategory.value === 'string'
					? row.laerm.dominantCategory.value
					: null;
			out.push({
				cluster: 'Lärm',
				value: describeLaermCategoryDe(raw),
				source: row.laerm.dominantCategory.layer,
				sourceUpdatedAt: formatStand(row.laerm.dominantCategory.sourceUpdatedAt)
			});
		}
		const gruen = row.gruen.dominantVersorgung;
		if (gruen) {
			const raw = typeof gruen.value === 'string' ? gruen.value : null;
			out.push({
				cluster: 'Grünversorgung',
				value: describeGruenversorgungDe(raw),
				source: gruen.layer,
				sourceUpdatedAt: formatStand(gruen.sourceUpdatedAt)
			});
		}
		const pet = row.klima.meanPet;
		if (pet && typeof pet.value === 'number') {
			out.push({
				cluster: 'Klima · PET',
				value: `${formatPet(pet.value)} (${describePetKategorie(pet.value)})`,
				source: pet.layer,
				sourceUpdatedAt: formatStand(pet.sourceUpdatedAt)
			});
		}
		const stops = row.oepnv.stopsPerKm2;
		if (stops && typeof stops.value === 'number') {
			out.push({
				cluster: 'ÖPNV-Dichte',
				value: `${formatStopsPerKm2(stops.value)} (${describeOepnvDichte(stops.value)})`,
				source: stops.layer,
				sourceUpdatedAt: formatStand(stops.sourceUpdatedAt)
			});
		}
		const wohnlage = row.wohnen.dominantWohnlage;
		if (wohnlage) {
			const raw = typeof wohnlage.value === 'string' ? wohnlage.value : null;
			out.push({
				cluster: 'Wohnlage',
				value: describeWohnlageDe(raw),
				source: wohnlage.layer,
				sourceUpdatedAt: formatStand(wohnlage.sourceUpdatedAt)
			});
		}
		const mss = row.wohnen.dominantMss;
		if (mss) {
			const raw = typeof mss.value === 'string' ? mss.value : null;
			out.push({
				cluster: 'Soziale Lage (MSS)',
				value: mssBeschreibungDe(raw),
				source: mss.layer,
				sourceUpdatedAt: formatStand(mss.sourceUpdatedAt)
			});
		}
		return out;
	}

	const steckbrief = $derived(stats ? buildSteckbrief(stats) : []);

	interface ScoreDimRow {
		readonly label: string;
		readonly value: number | null;
	}

	function formatScore(v: number | null | undefined): string {
		if (v === null || v === undefined || !Number.isFinite(v)) return '–';
		return Math.round(v).toString();
	}

	const scoreDims = $derived<ScoreDimRow[]>(
		score
			? [
					{ label: 'Ruhe & Luft', value: score.ruheLuft },
					{ label: 'Grün', value: score.gruen },
					{ label: 'Mobilität', value: score.mobilitaet },
					{ label: 'Versorgung', value: score.versorgung }
				]
			: []
	);
</script>

<article class="mx-auto max-w-3xl space-y-10 px-4 py-10" data-testid="kiez-hero">
	<header class="space-y-4">
		<p class="font-mono text-xs uppercase tracking-wider text-ink-subtle">
			{profile.bezirk ? `Bezirk ${profile.bezirk}` : 'Kiez'}
		</p>
		<h1 class="font-serif text-3xl text-ink md:text-4xl">{profile.name}</h1>
		<p class="max-w-prose font-serif text-lg leading-relaxed text-ink-muted">{leadText}</p>
	</header>

	{#if score}
		<section aria-labelledby="kiez-score-heading" class="space-y-4" data-testid="kiez-score">
			<h2 id="kiez-score-heading" class="font-serif text-2xl text-ink">Kiez-Score</h2>
			<div class="flex items-baseline gap-3 font-serif">
				<span class="text-5xl text-ink">{formatScore(score.composite)}</span>
				<span class="font-mono text-base text-ink-subtle">/ 100</span>
			</div>
			<dl class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{#each scoreDims as dim (dim.label)}
					<div>
						<dt class="font-mono text-xs uppercase tracking-wide text-ink-subtle">
							{dim.label}
						</dt>
						<dd class="font-serif text-2xl text-ink">{formatScore(dim.value)}</dd>
					</div>
				{/each}
			</dl>
			<p class="font-serif text-sm text-ink-muted">
				Aggregat aus 5 Dimensionen pro LOR-Bezirksregion, gleich gewichtet (jeweils 20%). Methodik
				auf der <a class="text-accent underline" href="/methodik/kiez-score">Methodik-Seite</a>.
			</p>
		</section>
	{/if}

	<section aria-labelledby="steckbrief-heading" class="space-y-4">
		<h2 id="steckbrief-heading" class="font-serif text-2xl text-ink">Steckbrief</h2>
		{#if !stats}
			<p class="font-serif text-base text-ink-muted">
				Aggregat-Werte werden mit dem nächsten Daten-Build freigeschaltet.
			</p>
		{:else if steckbrief.length === 0}
			<p class="font-serif text-base text-ink-muted">Keine Aggregat-Werte verfügbar.</p>
		{:else}
			<table class="w-full font-sans text-base" data-testid="kiez-steckbrief">
				<thead>
					<tr class="border-b border-rule text-left">
						<th class="py-2 pr-4 text-left font-semibold">Cluster</th>
						<th class="py-2 pr-4 text-left font-semibold">Wert</th>
						<th class="py-2 text-left font-semibold">Stand</th>
					</tr>
				</thead>
				<tbody>
					{#each steckbrief as row (row.cluster)}
						<tr class="border-b border-rule align-top">
							<th scope="row" class="py-3 pr-4 text-left font-semibold text-ink">{row.cluster}</th>
							<td class="py-3 pr-4 text-ink">
								<span>{row.value}</span>
								<span class="block font-mono text-xs text-ink-subtle">Quelle: {row.source}</span>
							</td>
							<td class="py-3 text-left font-mono text-xs text-ink-muted">{row.sourceUpdatedAt}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	{#if faq.length > 0}
		<FaqSection items={faq} pageType="kiez" />
	{:else}
		<section aria-labelledby="faq-placeholder-heading" class="space-y-3">
			<h2 id="faq-placeholder-heading" class="font-serif text-2xl text-ink">Häufige Fragen</h2>
			<p class="font-serif text-base text-ink-muted">
				FAQ-Einträge werden mit dem nächsten Daten-Build aus Story 2.5b ergänzt.
			</p>
		</section>
	{/if}
</article>
