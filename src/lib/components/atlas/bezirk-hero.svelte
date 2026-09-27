<!--
	Story 2.3 T3: BezirkHero-Long-Form-Layout (UX-DR43, Map-Embed entfernt
	2026-05-16 per User-Decision — Karte trug auf Bezirks-Seite keinen Mehrwert
	und schlug außerdem im Browser-Render fehl).

	Rendert pro Bezirk: H1 (Plex-Serif), Lead-Absatz mit Einwohner-/Flächen-Daten,
	Steckbrief-Tabelle aus `bezirk_stats` (Story 2.0), FAQ-Section aus
	`faq_qna` (Story 2.5b).

	Stats-Section rendert Placeholder wenn `stats === null` (DATABASE_URL fehlt
	im Build oder Story-2.0-Aggregat noch nicht gelaufen). FAQ rendert sich
	selbst aus wenn leer (siehe `faq-section.svelte`).

	i18n Block B4a: Rahmen (Lead, Steckbrief, FAQ-Platzhalter) auf Paraglide-
	Messages umgestellt. `profileProse` (Prosa) und `faq` (Frage/Antwort-
	Inhalte) bleiben deutsch (Boundary, Block C).
-->
<script lang="ts">
	import type { BezirkProfile, FaqEntry } from '$lib/data/types.js';
	import type { InferSelectModel } from 'drizzle-orm';
	import type { bezirkStats } from '$lib/server/db/schema/index.js';
	import FaqSection from './faq-section.svelte';
	import ScoreComparisonTable from './score-comparison-table.svelte';
	import type { ComparisonDimRow } from '$lib/data/comparison-types.js';
	import { sourceLabel } from '$lib/data/source-label.js';
	import DistributionBar from './distribution-bar.svelte';
	import { toSegments, countsText, type DistSegment } from '$lib/data/steckbrief-extras.js';
	import { describeLaermCategoryDe } from '$lib/data/faq-helpers/laerm.js';
	import { describeGruenversorgungDe } from '$lib/data/faq-helpers/gruen.js';
	import { describeWohnlageDe, mssBeschreibungDe } from '$lib/data/faq-helpers/wohnen.js';
	import { describeOepnvDichte, formatStopsPerKm2 } from '$lib/data/faq-helpers/oepnv.js';
	import { describePetKategorie, formatPet } from '$lib/data/faq-helpers/klima.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatCount, formatMonthYear } from '$lib/i18n/format.js';

	type BezirkStatsRow = InferSelectModel<typeof bezirkStats>;

	interface Props {
		readonly profile: BezirkProfile;
		readonly stats: BezirkStatsRow | null;
		readonly faq: readonly FaqEntry[];
		readonly comparison?: readonly ComparisonDimRow[];
		readonly profileProse?: readonly string[];
	}

	const { profile, stats, faq, comparison = [], profileProse = [] }: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });

	const leadText = $derived.by(() => {
		const parts: string[] = [`Bezirk ${profile.name}`];
		if (profile.einwohner > 0) {
			parts.push(m.profile_lead_einwohner({ count: formatCount(profile.einwohner, localeOpts) }));
		}
		if (profile.flaecheHa > 0) {
			parts.push(m.profile_lead_flaeche({ ha: formatCount(profile.flaecheHa, localeOpts) }));
		}
		return `${parts.join(', ')}. ${m.profile_lead_suffix(undefined, localeOpts)}`;
	});

	interface SteckbriefRow {
		readonly cluster: string;
		readonly value: string;
		readonly source: string;
		readonly sourceUpdatedAt: string;
		readonly distribution?: readonly DistSegment[];
		readonly extra?: string;
	}

	function buildSteckbrief(row: BezirkStatsRow): SteckbriefRow[] {
		const out: SteckbriefRow[] = [];
		if (row.laerm.dominantCategory) {
			const raw =
				typeof row.laerm.dominantCategory.value === 'string'
					? row.laerm.dominantCategory.value
					: null;
			out.push({
				cluster: m.steckbrief_cluster_laerm(undefined, localeOpts),
				value: describeLaermCategoryDe(raw, localeOpts),
				source: sourceLabel(row.laerm.dominantCategory.layer, localeOpts),
				sourceUpdatedAt: formatMonthYear(row.laerm.dominantCategory.sourceUpdatedAt, localeOpts),
				distribution: toSegments(row.laerm.categoryDistribution?.value)
			});
		}
		const gruen = row.gruen.dominantVersorgung;
		if (gruen) {
			const raw = typeof gruen.value === 'string' ? gruen.value : null;
			out.push({
				cluster: m.steckbrief_cluster_gruenversorgung(undefined, localeOpts),
				value: describeGruenversorgungDe(raw, localeOpts),
				source: sourceLabel(gruen.layer, localeOpts),
				sourceUpdatedAt: formatMonthYear(gruen.sourceUpdatedAt, localeOpts),
				distribution: toSegments(row.gruen.versorgungDistribution?.value),
				extra: countsText(
					[
						[
							m.steckbrief_extra_gruenanlagen(undefined, localeOpts),
							row.gruen.gruenanlagenCount?.value ?? null
						],
						[
							m.steckbrief_extra_spielplaetze(undefined, localeOpts),
							row.gruen.spielplaetzeCount?.value ?? null
						]
					],
					localeOpts
				)
			});
		}
		const pet = row.klima.meanPet;
		if (pet && typeof pet.value === 'number') {
			out.push({
				cluster: m.steckbrief_cluster_klima_pet(undefined, localeOpts),
				value: `${formatPet(pet.value, localeOpts)} (${describePetKategorie(pet.value, localeOpts)})`,
				source: sourceLabel(pet.layer, localeOpts),
				sourceUpdatedAt: formatMonthYear(pet.sourceUpdatedAt, localeOpts)
			});
		}
		const stops = row.oepnv.stopsPerKm2;
		if (stops && typeof stops.value === 'number') {
			out.push({
				cluster: m.steckbrief_cluster_oepnv_dichte(undefined, localeOpts),
				value: `${formatStopsPerKm2(stops.value, localeOpts)} (${describeOepnvDichte(stops.value, localeOpts)})`,
				source: sourceLabel(stops.layer, localeOpts),
				sourceUpdatedAt: formatMonthYear(stops.sourceUpdatedAt, localeOpts),
				extra: countsText(
					[
						[m.steckbrief_extra_u(undefined, localeOpts), row.oepnv.uBahnCount?.value ?? null],
						[m.steckbrief_extra_s(undefined, localeOpts), row.oepnv.sBahnCount?.value ?? null],
						[m.steckbrief_extra_tram(undefined, localeOpts), row.oepnv.tramCount?.value ?? null],
						[m.steckbrief_extra_bus(undefined, localeOpts), row.oepnv.busCount?.value ?? null]
					],
					localeOpts
				)
			});
		}
		const wohnlage = row.wohnen.dominantWohnlage;
		if (wohnlage) {
			const raw = typeof wohnlage.value === 'string' ? wohnlage.value : null;
			out.push({
				cluster: m.steckbrief_cluster_wohnlage(undefined, localeOpts),
				value: describeWohnlageDe(raw, localeOpts),
				source: sourceLabel(wohnlage.layer, localeOpts),
				sourceUpdatedAt: formatMonthYear(wohnlage.sourceUpdatedAt, localeOpts),
				distribution: toSegments(row.wohnen.wohnlageDistribution?.value)
			});
		}
		const mss = row.wohnen.dominantMss;
		if (mss) {
			const raw = typeof mss.value === 'string' ? mss.value : null;
			out.push({
				cluster: m.steckbrief_cluster_soziale_lage(undefined, localeOpts),
				value: mssBeschreibungDe(raw, localeOpts),
				source: sourceLabel(mss.layer, localeOpts),
				sourceUpdatedAt: formatMonthYear(mss.sourceUpdatedAt, localeOpts)
			});
		}
		return out;
	}

	const steckbrief = $derived(stats ? buildSteckbrief(stats) : []);
</script>

<article class="mx-auto max-w-3xl space-y-10 px-4 py-10" data-testid="bezirk-hero">
	<header class="space-y-4">
		<h1 class="font-serif text-3xl text-ink md:text-4xl">{profile.name}</h1>
		<p class="max-w-prose font-serif text-lg leading-relaxed text-ink-muted">{leadText}</p>
	</header>

	{#if profileProse.length > 0}
		<section
			aria-label={m.profile_section_aria(undefined, localeOpts)}
			lang={localeOpts.locale === 'de' ? undefined : 'de'}
			class="space-y-3"
			data-testid="bezirk-profile"
		>
			{#each profileProse as para (para)}
				<p class="font-serif text-base leading-relaxed text-ink">{para}</p>
			{/each}
		</section>
	{/if}

	<ScoreComparisonTable rows={comparison} showBezirkColumn={false} valueLabel="Bezirk" />

	<section aria-labelledby="steckbrief-heading" class="space-y-4">
		<h2 id="steckbrief-heading" class="font-serif text-2xl text-ink">
			{m.steckbrief_heading(undefined, localeOpts)}
		</h2>
		{#if !stats}
			<p class="font-serif text-base text-ink-muted">
				{m.steckbrief_no_data_build(undefined, localeOpts)}
			</p>
		{:else if steckbrief.length === 0}
			<p class="font-serif text-base text-ink-muted">
				{m.steckbrief_no_data_empty(undefined, localeOpts)}
			</p>
		{:else}
			<table class="w-full font-sans text-base" data-testid="bezirk-steckbrief">
				<thead>
					<tr class="border-b border-rule text-left">
						<th class="py-2 pr-4 font-semibold"
							>{m.steckbrief_col_cluster(undefined, localeOpts)}</th
						>
						<th class="py-2 pr-4 font-semibold">{m.steckbrief_col_wert(undefined, localeOpts)}</th>
						<th class="py-2 font-semibold">{m.steckbrief_col_stand(undefined, localeOpts)}</th>
					</tr>
				</thead>
				<tbody>
					{#each steckbrief as row (row.cluster)}
						<tr class="border-b border-rule align-top">
							<th scope="row" class="py-3 pr-4 text-left font-semibold text-ink">{row.cluster}</th>
							<td class="py-3 pr-4 text-ink">
								<span>{row.value}</span>
								{#if row.extra || (row.distribution && row.distribution.length > 0)}
									<details class="mt-1">
										<summary
											class="hover:text-accent-strong cursor-pointer font-mono text-xs text-accent"
											>{m.steckbrief_distribution_summary(undefined, localeOpts)}</summary
										>
										{#if row.extra}<span class="mt-1 block font-mono text-xs text-ink-muted"
												>{row.extra}</span
											>{/if}
										{#if row.distribution && row.distribution.length > 0}<DistributionBar
												segments={row.distribution}
											/>{/if}
									</details>
								{/if}
								<span class="block font-mono text-xs text-ink-subtle"
									>{m.steckbrief_source_prefix({ source: row.source }, localeOpts)}</span
								>
							</td>
							<td class="py-3 text-left font-mono text-xs text-ink-muted">{row.sourceUpdatedAt}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	{#if faq.length > 0}
		<FaqSection items={faq} pageType="bezirk" />
	{:else}
		<section aria-labelledby="faq-placeholder-heading" class="space-y-3">
			<h2 id="faq-placeholder-heading" class="font-serif text-2xl text-ink">
				{m.faq_section_heading(undefined, localeOpts)}
			</h2>
			<p class="font-serif text-base text-ink-muted">
				{m.profile_faq_placeholder(undefined, localeOpts)}
			</p>
		</section>
	{/if}
</article>
