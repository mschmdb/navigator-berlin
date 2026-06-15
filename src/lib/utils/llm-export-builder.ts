import {
	COMPOSITE_DIMENSIONS,
	type ClimateData,
	type ClimateStation,
	type KiezScore,
	type LayerHit,
	type LayerMetadata
} from '$lib/data';
import {
	DIMENSION_LABELS_DE,
	scaleFor
} from '$lib/components/atlas/inspector-panel/internal/kiez-score-display.js';
import {
	scoreDimensionLabelFor,
	contextNoteFor
} from '$lib/components/atlas/inspector-panel/internal/score-membership.js';
import { groupHitsBySection } from '$lib/components/atlas/inspector-panel/internal/sections.js';
import { getLayerExplainEntry } from '$lib/components/atlas/inspector-panel/internal/layer-explain.js';
import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';
import { formatLayerValue } from '$lib/components/atlas/inspector-panel/internal/value-formatters.js';
import { getEditorialConfig } from '$lib/components/atlas/internal/editorial-config.js';
import { DISCLAIMER_TEXTS_DE } from '$lib/components/atlas/editorial-disclaimer.svelte';
import {
	NORMAL_OLD,
	NORMAL_NEW,
	getNormalperiodMean,
	yearValuesToNumeric,
	type NumericYearPoint
} from './normalperiod.js';
import type {
	NearestStop,
	Modus
} from '$lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.js';
import {
	MOBILITY_SCORE_MAX,
	MOBILITY_SCORE_TOP_THRESHOLD,
	type MobilityRating
} from '$lib/components/atlas/inspector-panel/internal/mobility-rating.js';
import type {
	WahlResultsAtPoint,
	WahlResultBundle,
	LevelKey
} from '$lib/data/get-wahl-results-at-point.js';
import type { KiezDemografieData } from '$lib/components/atlas/inspector-panel/internal/demografie-types.js';

export interface LlmExportAddress {
	displayName: string;
	lat: number;
	lng: number;
	bezirk?: string;
	postcode?: string;
}

export interface LlmExportClimate {
	station: ClimateStation;
	series: ClimateData | null;
}

export interface LlmExportOepnv {
	nearest: Record<Modus, NearestStop | null>;
	rating: MobilityRating;
}

export interface LlmExportInput {
	readonly address: LlmExportAddress;
	readonly permalinkUrl: string;
	readonly generatedAt: string;
	readonly layerHits: readonly LayerHit[];
	readonly layerMeta: readonly LayerMetadata[];
	readonly climate: LlmExportClimate | null;
	readonly oepnv: LlmExportOepnv | null;
	readonly kiezScore?: KiezScore | null;
	readonly wahl?: WahlResultsAtPoint | null;
	readonly demografie?: KiezDemografieData | null;
	/** Räumlicher Bezug des Bevölkerungsprofils (spiegelt den Inspector-Scope). */
	readonly demografieBezug?: string | null;
	readonly laermDb?: number | null;
	/** Story 14.10: aggregierte Gesamt-Scores der Bezirksregion + des Bezirks (0–100). */
	readonly regional?: LlmExportRegional | null;
}

/** Regionaler Vergleich: Composite-Scores + Profil-Links für Kiez (BR) und Bezirk. */
export interface LlmExportRegional {
	readonly kiezName: string | null;
	readonly kiezSlug: string | null;
	readonly kiezComposite: number | null;
	readonly bezirkName: string | null;
	readonly bezirkSlug: string | null;
	readonly bezirkComposite: number | null;
}

const COORD_PRECISION = 5;
const FOOTER_HINT =
	'Du teilst diese Daten mit einer KI. Quellen-Links bleiben verbindlich, keine Werte oder Fakten dazuerfinden.';
const MODI: readonly { key: Modus; label: string }[] = [
	{ key: 'ubahn', label: 'U-Bahn' },
	{ key: 'sbahn', label: 'S-Bahn' },
	{ key: 'tram', label: 'Tram' },
	{ key: 'bus', label: 'Bus' }
];

function formatDate(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toISOString().slice(0, 10);
}

function formatNumber(n: number): string {
	return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(n);
}

function renderHeader(input: LlmExportInput, lines: string[]): void {
	lines.push(`# ${input.address.displayName}`);
	lines.push('');
	lines.push(
		`- Koordinaten: ${input.address.lat.toFixed(COORD_PRECISION)}, ${input.address.lng.toFixed(COORD_PRECISION)}`
	);
	if (input.address.bezirk) lines.push(`- Bezirk: ${input.address.bezirk}`);
	if (input.address.postcode) lines.push(`- PLZ: ${input.address.postcode}`);
	lines.push(`- Permalink: ${input.permalinkUrl}`);
	lines.push(`- Stand: ${formatDate(input.generatedAt)}`);
	lines.push('');
}

function reasonText(hit: LayerHit): string | null {
	if (hit.reason === 'coverage-out-of-scope') return 'Datensatz deckt diese Lage nicht ab';
	if (hit.reason === 'out-of-concept') return 'Nicht ausgewiesen für diese Lage';
	if (hit.reason === 'seasonal') return 'Layer Mai–Oktober aktiv';
	if (hit.reason === 'no-coverage') return 'Daten nicht vorhanden';
	return null;
}

function renderHit(hit: LayerHit, lines: string[], laermDb?: number | null): void {
	const display = getLayerDisplayName(hit.layer);
	const reasonLabel = reasonText(hit);
	const formatted = reasonLabel
		? { text: reasonLabel, isNumeric: false }
		: formatLayerValue(hit.layer, hit.value);
	const explain = getLayerExplainEntry(hit.layer);
	const editorial = getEditorialConfig(hit.layer);

	lines.push(`- **${display}**: ${formatted.text}`);
	// Story 14.11: Score-Zugehörigkeit explizit machen (wie der Inspector-Badge).
	const scoreDimLabel = scoreDimensionLabelFor(hit.layer);
	lines.push(
		scoreDimLabel ? `  - Im Kiez-Score: ${scoreDimLabel}` : '  - Kontext · nicht im Kiez-Score'
	);
	const membershipNote = contextNoteFor(hit.layer);
	if (membershipNote) lines.push(`  - Kontext-Hinweis: ${membershipNote}`);
	// Story 10.6b: dB-Kiez-Mittel (L_DEN) als Kontext zur 3-Stufen-Lärmkarte.
	if (hit.layer === 'laerm-2023' && typeof laermDb === 'number') {
		lines.push(`  - Lärm-Mittel (Kiez): ${laermDb} dB (L_DEN)`);
	}
	if (explain.short) lines.push(`  - Was: ${explain.short}`);
	if (explain.long && explain.long !== explain.short) lines.push(`  - Details: ${explain.long}`);
	if (explain.valueScaleExplain) lines.push(`  - Skala: ${explain.valueScaleExplain}`);
	lines.push(`  - Quelle: ${hit.source}`);
	lines.push(`  - Stand: ${formatDate(hit.updatedAt)}`);
	lines.push(`  - Lizenz: ${hit.license}`);

	if (editorial) {
		for (const variant of editorial.disclaimerVariants) {
			const text = DISCLAIMER_TEXTS_DE[variant];
			if (text) lines.push(`  - Hinweis (${variant}): ${text}`);
		}
		if (editorial.primarySourceUrl) {
			lines.push(`  - Primärquelle: ${editorial.primarySourceUrl}`);
		}
		if (editorial.neverMachineTranslate) {
			lines.push(
				'  - INTERPRETATIONS-WARNUNG: Diesen Wert nicht als Aussage über einzelne Menschen, Adressen oder Lebensqualität deuten. Strukturindikator auf Aggregat-Ebene (Planungsraum). Keine Rangfolge, keine Wertung daraus ableiten.'
			);
		}
	}
}

// Leer-Hits (kein Wert, keine aussagekräftige Begründung) sind für LLM Rauschen und
// verwirren Menschen. Informative Reasons (out-of-scope/out-of-concept/seasonal) bleiben.
function isRenderableHit(hit: LayerHit): boolean {
	if (hit.reason === 'no-coverage') return false;
	if (reasonText(hit)) return true;
	return formatLayerValue(hit.layer, hit.value).text !== 'Daten nicht vorhanden';
}

function renderSections(input: LlmExportInput, lines: string[]): void {
	const sections = groupHitsBySection(input.layerHits, input.layerMeta);
	for (const section of sections) {
		const hits = section.hits.filter(isRenderableHit);
		if (hits.length === 0) continue;
		lines.push(`## ${section.label}`);
		lines.push('');
		for (const hit of hits) {
			renderHit(hit, lines, input.laermDb);
		}
		lines.push('');
	}
}

function minMaxLatest(
	points: readonly NumericYearPoint[]
): { min: NumericYearPoint; max: NumericYearPoint; latest: NumericYearPoint } | null {
	if (points.length === 0) return null;
	let min = points[0]!;
	let max = points[0]!;
	let latest = points[0]!;
	for (const p of points) {
		if (p.value < min.value) min = p;
		if (p.value > max.value) max = p;
		if (p.year > latest.year) latest = p;
	}
	return { min, max, latest };
}

function renderClimateIndicator(
	label: string,
	points: readonly NumericYearPoint[],
	formatVal: (n: number) => string,
	lines: string[]
): void {
	const mml = minMaxLatest(points);
	if (!mml) return;
	const oldMean = getNormalperiodMean(points, NORMAL_OLD.from, NORMAL_OLD.to);
	const newMean = getNormalperiodMean(points, NORMAL_NEW.from, NORMAL_NEW.to);
	const parts: string[] = [
		`Min: ${formatVal(mml.min.value)} (${mml.min.year})`,
		`Max: ${formatVal(mml.max.value)} (${mml.max.year})`,
		`Latest: ${formatVal(mml.latest.value)} (${mml.latest.year})`
	];
	if (oldMean !== null) {
		parts.push(`Mittel 1961–1990: ${formatVal(oldMean)}`);
	}
	if (newMean !== null) {
		parts.push(`Mittel 1991–2020: ${formatVal(newMean)}`);
	}
	lines.push(`- ${label} · ${parts.join(' · ')}`);
}

function renderClimate(input: LlmExportInput, lines: string[]): void {
	if (!input.climate) return;
	const { station, series } = input.climate;
	lines.push('## Klima');
	lines.push('');
	lines.push(`- Station: ${station.name} (${station.id})`);

	if (series) {
		const fmtInt = (n: number): string => `${Math.round(n)}`;
		const fmtTemp = (n: number): string => `${formatNumber(n)} °C`;
		renderClimateIndicator(
			'Sommertage (≥25 °C)',
			yearValuesToNumeric(series.summerDays, 'count'),
			fmtInt,
			lines
		);
		renderClimateIndicator(
			'Heiße Tage (>30 °C)',
			yearValuesToNumeric(series.hotDays, 'count'),
			fmtInt,
			lines
		);
		renderClimateIndicator(
			'Frost-Tage',
			yearValuesToNumeric(series.frostDays, 'count'),
			fmtInt,
			lines
		);
		renderClimateIndicator(
			'Jahres-Mittelwert',
			yearValuesToNumeric(series.annualMeanTemp, 'temp'),
			fmtTemp,
			lines
		);
		const trend = climateTrend(series);
		if (trend) lines.push(`- Trend (Mittelwert ${trend.fromYear}–${trend.toYear}): ${trend.label}`);
	}
	lines.push('- Quelle: DWD CDC Stations-Daten');
	lines.push('');
}

interface ClimateTrendInfo {
	fromYear: number;
	toYear: number;
	label: string;
}

function climateTrend(series: ClimateData): ClimateTrendInfo | null {
	const temps = series.annualMeanTemp;
	if (!temps || temps.length < 2) return null;
	const sorted = [...temps].sort((a, b) => a.year - b.year);
	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	if (!first || !last || typeof first.temp !== 'number' || typeof last.temp !== 'number') {
		return null;
	}
	const delta = last.temp - first.temp;
	const arrow = delta > 0.5 ? 'steigend' : delta < -0.5 ? 'fallend' : 'stabil';
	return {
		fromYear: first.year,
		toYear: last.year,
		label: `${arrow} (${delta >= 0 ? '+' : ''}${formatNumber(delta)} °C)`
	};
}

function renderOepnv(input: LlmExportInput, lines: string[]): void {
	if (!input.oepnv) return;
	const { nearest, rating } = input.oepnv;
	lines.push('## Mobilität');
	lines.push('');
	lines.push(
		`- Anbindungs-Rating: ${rating.label} (Score ${formatNumber(rating.score)} von ${formatNumber(MOBILITY_SCORE_MAX)}, sehr gut ab ${MOBILITY_SCORE_TOP_THRESHOLD}; Heuristik aus Distanz zu U/S-Bahn, Tram, Bus)`
	);
	for (const { key, label } of MODI) {
		const stop = nearest[key];
		if (!stop) continue;
		const softSuffix = stop.soft ? ' · schwach (außerhalb 600 m)' : '';
		lines.push(
			`- ${label}: ${stop.name} · ${stop.distanceM} m · ${stop.walkingMin} min${softSuffix}`
		);
	}
	lines.push('');
}

function renderKiezScore(input: LlmExportInput, lines: string[]): void {
	const score = input.kiezScore;
	if (!score) return;
	lines.push('## Kiez-Score');
	lines.push('');
	lines.push('- Skala: 0–25 gering · 26–50 mittel · 51–75 hoch · 76–100 sehr hoch');
	if (typeof score.overall === 'number') {
		const overallScale = scaleFor(score.overall, 'ruhe-luft');
		const stufe = overallScale ? overallScale.label : '—';
		// Gesamt = Mittel NUR über die Composite-Dimensionen (Kultur/Kriminalität zählen
		// als Kontext nicht mit). Spiegelt usedDimsCount/COMPOSITE_DIMENSIONS.length im Inspector.
		const usedComposite = score.dimensions.filter(
			(d) => d.value !== null && COMPOSITE_DIMENSIONS.includes(d.dimension)
		).length;
		lines.push(
			`- Gesamt: ${stufe} (${Math.round(score.overall)}/100, Mittel über ${usedComposite}/${COMPOSITE_DIMENSIONS.length} Dimensionen)`
		);
	}
	for (const dim of score.dimensions) {
		const label = DIMENSION_LABELS_DE[dim.dimension];
		const kontext = COMPOSITE_DIMENSIONS.includes(dim.dimension)
			? ''
			: ' (Kontext, nicht im Gesamt-Score)';
		if (dim.value === null) {
			lines.push(`- ${label}${kontext}: Daten unzureichend`);
			continue;
		}
		const scale = scaleFor(dim.value, dim.dimension);
		const stufe = scale ? scale.label : '—';
		const sources = dim.sources
			.filter((s) => s.normalizedValue !== null)
			.map(
				(s) =>
					`${s.layer} (${Math.round(s.normalizedValue as number)}/100, Gewicht ${Math.round(s.weight * 100)}%)`
			)
			.join(', ');
		lines.push(`- ${label}${kontext}: ${stufe} (${Math.round(dim.value)}/100)`);
		if (sources) lines.push(`  Quellen: ${sources}`);
		if (dim.dataStand) lines.push(`  Stand: ${formatDate(dim.dataStand)}`);
	}
	lines.push('');
	lines.push(
		`> Umwelt- & Infrastruktur-Score aus ${COMPOSITE_DIMENSIONS.length} Dimensionen pro Planungsraum (rund 7.500 Einwohner:innen). Misst nur Größen mit eindeutiger Besser-Richtung. Sozialstruktur und Bezahlbarkeit bewusst nicht enthalten. Methodik: /methodik/kiez-score.`
	);
	lines.push('');
}

/** Story 14.10: Gesamt-Scores der Region (Bezirksregion + Bezirk) + Profil-Links. */
function renderRegional(input: LlmExportInput, lines: string[]): void {
	const r = input.regional;
	if (!r) return;
	const rows: string[] = [];
	if (r.kiezComposite !== null) {
		const name = r.kiezName ?? 'Bezirksregion';
		const link = r.kiezSlug ? ` · Profil /kiez/${r.kiezSlug}` : '';
		rows.push(`- Bezirksregion ${name}: Gesamt-Score ${Math.round(r.kiezComposite)}/100${link}`);
	}
	if (r.bezirkComposite !== null) {
		const name = r.bezirkName ?? 'Bezirk';
		const link = r.bezirkSlug ? ` · Profil /bezirk/${r.bezirkSlug}` : '';
		rows.push(`- Bezirk ${name}: Gesamt-Score ${Math.round(r.bezirkComposite)}/100${link}`);
	}
	if (rows.length === 0) return;
	lines.push('## Regionaler Vergleich');
	lines.push('');
	lines.push(...rows);
	lines.push('');
	lines.push(
		'> Gesamt-Score aggregiert über die Planungsräume der Region (Mittel). Einordnender Kontext, nicht die Adresse selbst.'
	);
	lines.push('');
}

const WAHL_TYP_LABELS: Record<'btw' | 'agh' | 'bvv', string> = {
	btw: 'Bundestag',
	agh: 'Abgeordnetenhaus',
	bvv: 'BVV'
};
const WAHL_STIMMTYP_LABELS: Record<'erststimme' | 'zweitstimme' | 'einstimme', string> = {
	erststimme: 'Erststimme',
	zweitstimme: 'Zweitstimme',
	einstimme: 'Stimme'
};
const WAHL_LEVEL_LABELS: Record<LevelKey, string> = {
	stimmbezirk: 'Stimmbezirk',
	kiez: 'Kiez',
	bezirk: 'Bezirk',
	berlin: 'Berlin gesamt'
};
const WAHL_STIMMTYP_PREF: readonly ('zweitstimme' | 'erststimme' | 'einstimme')[] = [
	'zweitstimme',
	'erststimme',
	'einstimme'
];
const WAHL_LEVEL_PREF: readonly LevelKey[] = ['kiez', 'bezirk', 'stimmbezirk', 'berlin'];

function formatPct(anteil: number): string {
	return `${(anteil * 100).toFixed(1).replace('.', ',')} %`;
}

function renderWahl(input: LlmExportInput, lines: string[]): void {
	const wahl = input.wahl;
	if (!wahl || wahl.wahlen.length === 0) return;
	const typen = (['btw', 'agh', 'bvv'] as const).filter((t) =>
		wahl.wahlen.some((b) => b.wahl.typ === t)
	);
	if (typen.length === 0) return;

	lines.push('## Wahlverhalten');
	lines.push('');
	for (const typ of typen) {
		const bundles = wahl.wahlen.filter((b) => b.wahl.typ === typ);
		const latestYear = Math.max(...bundles.map((b) => b.wahl.jahr));
		const yearBundles = bundles.filter((b) => b.wahl.jahr === latestYear);
		const stimmtyp =
			WAHL_STIMMTYP_PREF.find((s) => yearBundles.some((b) => b.wahl.stimmtyp === s)) ??
			yearBundles[0]!.wahl.stimmtyp;
		const bundle: WahlResultBundle =
			yearBundles.find((b) => b.wahl.stimmtyp === stimmtyp) ?? yearBundles[0]!;
		const level = WAHL_LEVEL_PREF.find((l) => bundle.levels[l]?.available) ?? null;
		const top5 = (level ? bundle.levels[level]?.top5 : null) ?? [];

		// Berlin-Gesamt als Vergleichsanker (links/rechts vs. Stadt), wenn nicht selbst Berlin-Ebene.
		const berlinTop5 =
			level !== 'berlin' && bundle.levels.berlin?.available
				? (bundle.levels.berlin.top5 ?? [])
				: [];
		const berlinAnteil = (kurzname: string): number | null =>
			berlinTop5.find((e) => e.kurzname === kurzname)?.anteil ?? null;

		const levelLabel = level ? WAHL_LEVEL_LABELS[level] : '—';
		lines.push(
			`### ${WAHL_TYP_LABELS[typ]} ${latestYear} · ${WAHL_STIMMTYP_LABELS[stimmtyp]} · Ebene ${levelLabel}`
		);
		if (bundle.wahl.isRepeatElection) lines.push('- (Wiederholungswahl)');
		if (top5.length === 0) {
			lines.push('- Keine Daten für diese Ebene');
		} else {
			for (const entry of top5.slice(0, 5)) {
				const cmp = berlinAnteil(entry.kurzname);
				const cmpStr = cmp !== null ? ` (Berlin gesamt: ${formatPct(cmp)})` : '';
				lines.push(`- ${entry.vollname} (${entry.kurzname}): ${formatPct(entry.anteil)}${cmpStr}`);
			}
		}
		const source = bundle.wahl.sourceUrl.includes('bundeswahlleiterin')
			? 'Bundeswahlleiterin'
			: 'Amt für Statistik Berlin-Brandenburg';
		lines.push(`- Quelle: ${source} · Lizenz ${bundle.wahl.license}`);
		lines.push('');
	}
}

function renderDemografie(input: LlmExportInput, lines: string[]): void {
	const d = input.demografie;
	if (!d) return;
	const intFmt = (n: number): string => new Intl.NumberFormat('de-DE').format(n);
	const pct = (anteil: number): string =>
		`${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(anteil * 100)} %`;

	lines.push('## Bevölkerungsprofil');
	lines.push('');
	if (input.demografieBezug) lines.push(`- Bezug: ${input.demografieBezug}`);
	lines.push('- Neutraler Kontext, keine Wertung: dicht ist nicht besser als locker.');
	if (d.dichteEwKm2 !== null) {
		lines.push(`- Einwohnerdichte: ${intFmt(Math.round(d.dichteEwKm2))} EW/km²`);
	}
	lines.push(`- Einwohner gesamt: ${intFmt(d.einwohner)}`);
	lines.push(`- Kinder 0–6: ${pct(d.anteilKinder0bis6)}`);
	lines.push(`- Kinder 6–12: ${pct(d.anteilKinder6bis12)}`);
	lines.push(`- Senioren 65+: ${pct(d.anteilSenioren65plus)}`);
	if (d.jugendquotient !== null) lines.push(`- Jugendquotient: ${formatNumber(d.jugendquotient)}`);
	if (d.altenquotient !== null) lines.push(`- Altenquotient: ${formatNumber(d.altenquotient)}`);
	// erwerbsanteil ist bereits ein Prozentwert (erw/gesamt*100), nicht 0–1: kein erneutes ×100.
	if (d.erwerbsanteil !== null) lines.push(`- Erwerbsanteil: ${formatNumber(d.erwerbsanteil)} %`);
	lines.push(`- Stand: ${d.datenstand} · ${d.quelle} · ${d.lizenz}`);
	lines.push('');
}

function renderFooter(lines: string[]): void {
	lines.push('---');
	lines.push('');
	lines.push(`> ${FOOTER_HINT}`);
	lines.push('');
}

export function buildLlmExportMarkdown(input: LlmExportInput): string {
	const lines: string[] = [];
	renderHeader(input, lines);
	renderKiezScore(input, lines);
	renderRegional(input, lines);
	renderSections(input, lines);
	renderClimate(input, lines);
	renderOepnv(input, lines);
	renderDemografie(input, lines);
	renderWahl(input, lines);
	renderFooter(lines);
	return lines.join('\n');
}

const CHARS_PER_TOKEN = 4;

export function approximateTokens(text: string): number {
	if (text.length === 0) return 0;
	return Math.ceil(text.length / CHARS_PER_TOKEN);
}
