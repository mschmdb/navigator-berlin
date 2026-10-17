<!--
	Story 2.4 T3 / L2: Long-Form-Teil der Kiez-Seite unterhalb des Heros.
	Der Hero (H1, Fakten, Umriss, Stärke, Karten-Button) steckt in `kiez-hero.svelte`.

	Rendert Profil-Prosa, Kiez-Score-Summary aus Story 2.9a (composite + 4
	Dimensionen; Soziale Lage off per Stigma-Schutz), Vergleichstabelle,
	Steckbrief-Tabelle aus `kiez_stats` (Story 2.0), Wahl-Verlauf und die
	FAQ-Section aus `faq_qna` (Story 2.5b).

	Sections rendern Placeholder wenn `stats === null` oder `score === null`
	(DATABASE_URL fehlt im Build oder Story-2.0/2.9a-Aggregat noch nicht
	gelaufen).

	i18n Block B4a: Rahmen auf Paraglide-Messages. `profileProse` (Prosa) und
	`faq` (Frage/Antwort-Inhalte) kommen in der Seiten-Locale oder als
	DE-Fallback (Blocks C3, C5); `profileLocale`/`faqLocale` steuern `lang`.
-->
<script lang="ts">
	import type { KiezProfile, FaqEntry } from '$lib/data/types.js';
	import type { InferSelectModel } from 'drizzle-orm';
	import type { kiezStats } from '$lib/server/db/schema/index.js';
	import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';
	import FaqSection from './faq-section.svelte';
	import KiezWahlVerlauf, { type WahlVerlaufRow } from './kiez-wahl-verlauf.svelte';
	import ScoreComparisonTable from './score-comparison-table.svelte';
	import { SCORE_DIMENSION_KEYS, type ComparisonDimRow } from '$lib/data/comparison-types.js';
	import { sourceLabel } from '$lib/data/source-label.js';
	import DistributionBar from './distribution-bar.svelte';
	import { toSegments, countsText, type DistSegment } from '$lib/data/steckbrief-extras.js';
	import { describeLaermCategoryDe } from '$lib/data/faq-helpers/laerm.js';
	import { describeGruenversorgungDe } from '$lib/data/faq-helpers/gruen.js';
	import { describeWohnlageDe, mssBeschreibungDe } from '$lib/data/faq-helpers/wohnen.js';
	import { describeOepnvDichte, formatStopsPerKm2 } from '$lib/data/faq-helpers/oepnv.js';
	import { describePetKategorie, formatPet } from '$lib/data/faq-helpers/klima.js';
	import { dimensionLabel } from './inspector-panel/internal/kiez-score-display.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { formatMonthYear } from '$lib/i18n/format.js';
	import { COMPOSITE_DIMENSIONS, type KiezScoreDimension } from '$lib/data';

	type KiezStatsRow = InferSelectModel<typeof kiezStats>;

	interface Props {
		readonly profile: KiezProfile;
		readonly stats: KiezStatsRow | null;
		readonly score: KiezScore | null;
		readonly faq: readonly FaqEntry[];
		readonly faqLocale?: Locale;
		readonly wahlVerlauf?: readonly WahlVerlaufRow[];
		readonly comparison?: readonly ComparisonDimRow[];
		readonly profileProse?: readonly string[];
		/** Sprache der Profil-Absätze (C5); fehlt sie, gilt die Seiten-Locale. Weicht sie von der Seiten-Locale ab, setzt die Sektion `lang`. */
		readonly profileLocale?: Locale;
	}

	const {
		profile,
		stats,
		score,
		faq,
		faqLocale,
		wahlVerlauf = [],
		comparison = [],
		profileProse = [],
		profileLocale
	}: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });

	interface SteckbriefRow {
		readonly cluster: string;
		readonly value: string;
		readonly source: string;
		readonly sourceUpdatedAt: string;
		readonly distribution?: readonly DistSegment[];
		readonly extra?: string;
	}

	function buildSteckbrief(row: KiezStatsRow): SteckbriefRow[] {
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
				distribution: toSegments(row.laerm.categoryDistribution?.value, {
					...localeOpts,
					kind: 'laerm'
				})
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
				distribution: toSegments(row.gruen.versorgungDistribution?.value, {
					...localeOpts,
					kind: 'gruen'
				}),
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
				distribution: toSegments(row.wohnen.wohnlageDistribution?.value, {
					...localeOpts,
					kind: 'wohnlage'
				})
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

	interface ScoreDimRow {
		readonly key: KiezScoreDimension;
		readonly label: string;
		readonly value: number | null;
	}

	function formatScore(v: number | null | undefined): string {
		if (v === null || v === undefined || !Number.isFinite(v)) return '–';
		return Math.round(v).toString();
	}

	// Score-Summary zeigt nur die COMPOSITE_DIMENSIONS-Teilmenge (Kultur/
	// Kriminalität fließen nicht in den Gesamt-Score, siehe Vergleichstabelle
	// darunter). `SCORE_DIMENSION_KEYS` ist die geteilte Zuordnung camelCase ↔
	// hyphenierter Anzeige-Schlüssel (auch in beiden `+page.server.ts`).
	const COMPOSITE_SCORE_DIM_KEYS = SCORE_DIMENSION_KEYS.filter((d) =>
		(COMPOSITE_DIMENSIONS as readonly string[]).includes(d.key)
	);

	const scoreDims = $derived<ScoreDimRow[]>(
		score
			? COMPOSITE_SCORE_DIM_KEYS.map(({ field, key }) => ({
					key,
					label: dimensionLabel(key, localeOpts),
					value: (score[field as keyof KiezScore] as number | null | undefined) ?? null
				}))
			: []
	);
</script>

<div class="mx-auto max-w-3xl space-y-10 px-4 pb-10" data-testid="kiez-details">
	{#if profileProse.length > 0}
		<section
			aria-label={m.profile_section_aria(undefined, localeOpts)}
			lang={profileLocale === undefined || profileLocale === localeOpts.locale
				? undefined
				: profileLocale}
			class="space-y-3"
			data-testid="kiez-profile"
		>
			{#each profileProse as para (para)}
				<p class="text-base leading-body text-ink">{para}</p>
			{/each}
		</section>
	{/if}

	{#if score}
		<section aria-labelledby="kiez-score-heading" class="space-y-4" data-testid="kiez-score">
			<h2 id="kiez-score-heading" class="text-2xl font-bold text-ink">
				{m.profile_score_heading(undefined, localeOpts)}
			</h2>
			<dl class="grid grid-cols-3 gap-4 sm:grid-cols-5">
				{#each scoreDims as dim (dim.key)}
					<div>
						<dt class="text-xs text-ink-subtle">
							{dim.label}
						</dt>
						<dd class="text-2xl font-semibold text-ink">{formatScore(dim.value)}</dd>
					</div>
				{/each}
			</dl>
			<p class="text-sm text-ink-muted">
				{m.profile_score_methodik_note(undefined, localeOpts)}
				<a class="text-accent underline" href={localizedHref('/methodik/kiez-score')}
					>{m.profile_score_methodik_link_label(undefined, localeOpts)}</a
				>.
			</p>
		</section>
	{/if}

	<ScoreComparisonTable rows={comparison} showBezirkColumn={true} valueLabel="Kiez" />

	<section aria-labelledby="steckbrief-heading" class="space-y-4">
		<h2 id="steckbrief-heading" class="text-2xl font-bold text-ink">
			{m.steckbrief_heading(undefined, localeOpts)}
		</h2>
		{#if !stats}
			<p class="text-base text-ink-muted">
				{m.steckbrief_no_data_build(undefined, localeOpts)}
			</p>
		{:else if steckbrief.length === 0}
			<p class="text-base text-ink-muted">
				{m.steckbrief_no_data_empty(undefined, localeOpts)}
			</p>
		{:else}
			<table class="w-full font-sans text-base" data-testid="kiez-steckbrief">
				<thead>
					<tr class="border-b border-rule text-left">
						<th class="py-2 pr-4 text-left font-semibold"
							>{m.steckbrief_col_cluster(undefined, localeOpts)}</th
						>
						<th class="py-2 pr-4 text-left font-semibold"
							>{m.steckbrief_col_wert(undefined, localeOpts)}</th
						>
						<th class="py-2 text-left font-semibold"
							>{m.steckbrief_col_stand(undefined, localeOpts)}</th
						>
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
											class="cursor-pointer py-1 text-xs text-accent hover:text-accent-strong"
											>{m.steckbrief_distribution_summary(undefined, localeOpts)}</summary
										>
										{#if row.extra}<span class="mt-1 block text-xs text-ink-muted">{row.extra}</span
											>{/if}
										{#if row.distribution && row.distribution.length > 0}<DistributionBar
												segments={row.distribution}
											/>{/if}
									</details>
								{/if}
								<span class="block text-xs text-ink-subtle"
									>{m.steckbrief_source_prefix({ source: row.source }, localeOpts)}</span
								>
							</td>
							<td class="py-3 text-left text-xs text-ink-muted tabular-nums"
								>{row.sourceUpdatedAt}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<KiezWahlVerlauf kiezName={profile.name} rows={wahlVerlauf} />

	{#if faq.length > 0}
		<FaqSection items={faq} pageType="kiez" contentLocale={faqLocale} />
	{:else}
		<section aria-labelledby="faq-placeholder-heading" class="space-y-3">
			<h2 id="faq-placeholder-heading" class="text-2xl font-bold text-ink">
				{m.faq_section_heading(undefined, localeOpts)}
			</h2>
			<p class="text-base text-ink-muted">
				{m.profile_faq_placeholder(undefined, localeOpts)}
			</p>
		</section>
	{/if}
</div>
