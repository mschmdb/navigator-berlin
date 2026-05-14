import type { ClimateData, ClimateStation, LayerHit, LayerMetadata } from '$lib/data';
import { groupHitsBySection } from '$lib/components/atlas/inspector-panel/internal/sections.js';
import { getLayerExplainEntry } from '$lib/components/atlas/inspector-panel/internal/layer-explain.js';
import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';
import { formatLayerValue } from '$lib/components/atlas/inspector-panel/internal/value-formatters.js';
import { getEditorialConfig } from '$lib/components/atlas/internal/editorial-config.js';
import { DISCLAIMER_TEXTS_DE } from '$lib/components/atlas/editorial-disclaimer.svelte';
import type {
	NearestStop,
	Modus
} from '$lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.js';
import type { MobilityRating } from '$lib/components/atlas/inspector-panel/internal/mobility-rating.js';

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
}

const COORD_PRECISION = 5;
const FOOTER_HINT =
	'Du teilst diese Daten mit einer KI. Quellen-Links bleiben verbindlich, keine zusätzlichen Personen-Biografien generieren (Stolperstein-Würde).';
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

function latest<T extends { count?: number; temp?: number; year: number }>(
	values: readonly T[] | undefined
): T | null {
	if (!values || values.length === 0) return null;
	return [...values].sort((a, b) => b.year - a.year)[0] ?? null;
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

function renderHit(hit: LayerHit, lines: string[]): void {
	const display = getLayerDisplayName(hit.layer);
	const formatted = formatLayerValue(hit.layer, hit.value);
	const explain = getLayerExplainEntry(hit.layer);
	const editorial = getEditorialConfig(hit.layer);

	lines.push(`- **${display}**: ${formatted.text}`);
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
			lines.push('  - (Editorial sensible, bitte nicht algorithmisch interpretieren)');
		}
	}
}

function renderSections(input: LlmExportInput, lines: string[]): void {
	const sections = groupHitsBySection(input.layerHits, input.layerMeta);
	for (const section of sections) {
		if (section.hits.length === 0) continue;
		lines.push(`## ${section.label}`);
		lines.push('');
		for (const hit of section.hits) {
			renderHit(hit, lines);
		}
		lines.push('');
	}
}

const NORMAL_OLD = { from: 1961, to: 1990 };
const NORMAL_NEW = { from: 1991, to: 2020 };

interface NumericPoint {
	year: number;
	value: number;
}

function toNumeric<T extends { year: number; count?: number; temp?: number }>(
	values: readonly T[] | undefined,
	field: 'count' | 'temp'
): NumericPoint[] {
	if (!values) return [];
	const out: NumericPoint[] = [];
	for (const v of values) {
		const raw = v[field];
		if (typeof raw === 'number' && Number.isFinite(raw)) {
			out.push({ year: v.year, value: raw });
		}
	}
	return out;
}

function meanInRange(points: readonly NumericPoint[], from: number, to: number): number | null {
	const inRange = points.filter((p) => p.year >= from && p.year <= to);
	if (inRange.length === 0) return null;
	const sum = inRange.reduce((acc, p) => acc + p.value, 0);
	return sum / inRange.length;
}

function minMaxLatest(points: readonly NumericPoint[]): { min: NumericPoint; max: NumericPoint; latest: NumericPoint } | null {
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
	points: readonly NumericPoint[],
	formatVal: (n: number) => string,
	lines: string[]
): void {
	const mml = minMaxLatest(points);
	if (!mml) return;
	const oldMean = meanInRange(points, NORMAL_OLD.from, NORMAL_OLD.to);
	const newMean = meanInRange(points, NORMAL_NEW.from, NORMAL_NEW.to);
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
		renderClimateIndicator('Heiße Tage (>30 °C)', toNumeric(series.hotDays, 'count'), fmtInt, lines);
		renderClimateIndicator('Frost-Tage', toNumeric(series.frostDays, 'count'), fmtInt, lines);
		renderClimateIndicator(
			'Jahres-Mittelwert',
			toNumeric(series.annualMeanTemp, 'temp'),
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
	lines.push(`- Anbindungs-Rating: ${rating.label} (Score ${formatNumber(rating.score)})`);
	for (const { key, label } of MODI) {
		const stop = nearest[key];
		if (!stop) continue;
		const softSuffix = stop.soft ? ' · schwach (außerhalb 600 m)' : '';
		lines.push(`- ${label}: ${stop.name} · ${stop.distanceM} m · ${stop.walkingMin} min${softSuffix}`);
	}
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
	renderSections(input, lines);
	renderClimate(input, lines);
	renderOepnv(input, lines);
	renderFooter(lines);
	return lines.join('\n');
}

const CHARS_PER_TOKEN = 4;

export function approximateTokens(text: string): number {
	if (text.length === 0) return 0;
	return Math.ceil(text.length / CHARS_PER_TOKEN);
}
