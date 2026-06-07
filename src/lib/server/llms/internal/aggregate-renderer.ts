/**
 * Story 2.8: Geteilte Cluster-Renderer-Helpers für Bezirk + Kiez.
 *
 * Reiner Pure-Function-Helper, kein I/O. Bezirk- und Kiez-Stats teilen das
 * gleiche `BezirkStats`/`KiezStats`-Shape (8 Cluster), deshalb DRY.
 */

import type { AggregateValue } from '$lib/server/db/schema/index.js';
import type { BezirkStats } from '$lib/server/db/queries/get-bezirk-stats.js';

const NUMBER_DE = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

export function formatNumberDe(n: number): string {
	return NUMBER_DE.format(n);
}

export function formatAttribution<T>(av: AggregateValue<T> | null | undefined): string {
	if (!av) return '';
	const date = av.sourceUpdatedAt.slice(0, 10);
	return ` (Quelle: ${av.layer}, Stand ${date})`;
}

export function formatKm2(flaecheHa: number): string {
	return `${formatNumberDe(flaecheHa / 100)} km²`;
}

/**
 * Rendert die 8 Daten-Cluster (Lärm/Luft/Grün/Klima/Wohnen/ÖPNV/Bildung/Heritage)
 * eines `BezirkStats`/`KiezStats`-Aggregats in Markdown-Sections.
 *
 * Skips komplette Cluster-Sektionen wenn alle Werte des Clusters null sind.
 */
export function renderAggregateClusters(stats: BezirkStats, lines: string[]): void {
	renderLaerm(stats, lines);
	renderLuft(stats, lines);
	renderGruen(stats, lines);
	renderKlima(stats, lines);
	renderWohnen(stats, lines);
	renderOepnv(stats, lines);
	renderBildung(stats, lines);
}

function renderLaerm(stats: BezirkStats, lines: string[]): void {
	if (!stats.laerm.dominantCategory) return;
	lines.push('### Lärm');
	lines.push('');
	const cat = stats.laerm.dominantCategory;
	lines.push(`- Dominante Kategorie: ${cat.value}${formatAttribution(cat)}`);
	lines.push('');
}

function renderLuft(stats: BezirkStats, lines: string[]): void {
	if (!stats.luft.dominantCategory) return;
	lines.push('### Luft');
	lines.push('');
	const cat = stats.luft.dominantCategory;
	lines.push(`- Dominante Kategorie: ${cat.value}${formatAttribution(cat)}`);
	lines.push('');
}

function renderGruen(stats: BezirkStats, lines: string[]): void {
	const g = stats.gruen;
	if (!g.dominantVersorgung && !g.gruenanlagenCount && !g.spielplaetzeCount) return;
	lines.push('### Grün');
	lines.push('');
	if (g.dominantVersorgung) {
		lines.push(
			`- Dominante Versorgung: ${g.dominantVersorgung.value}${formatAttribution(g.dominantVersorgung)}`
		);
	}
	if (g.gruenanlagenCount) {
		lines.push(
			`- Grünanlagen: ${formatNumberDe(g.gruenanlagenCount.value)}${formatAttribution(g.gruenanlagenCount)}`
		);
	}
	if (g.spielplaetzeCount) {
		lines.push(
			`- Spielplätze: ${formatNumberDe(g.spielplaetzeCount.value)}${formatAttribution(g.spielplaetzeCount)}`
		);
	}
	lines.push('');
}

function renderKlima(stats: BezirkStats, lines: string[]): void {
	const k = stats.klima;
	if (!k.meanPet && !k.shareSehrHeiss) return;
	lines.push('### Klima');
	lines.push('');
	if (k.meanPet) {
		lines.push(
			`- PET-Mittelwert: ${formatNumberDe(k.meanPet.value)} °C${formatAttribution(k.meanPet)}`
		);
	}
	if (k.shareSehrHeiss) {
		const pct = formatNumberDe(k.shareSehrHeiss.value * 100);
		lines.push(`- Anteil sehr-heiße Flächen: ${pct} %${formatAttribution(k.shareSehrHeiss)}`);
	}
	lines.push('');
}

function renderWohnen(stats: BezirkStats, lines: string[]): void {
	const w = stats.wohnen;
	if (!w.dominantWohnlage && !w.dominantMss) return;
	lines.push('### Wohnen');
	lines.push('');
	if (w.dominantWohnlage) {
		lines.push(
			`- Dominante Wohnlage: ${w.dominantWohnlage.value}${formatAttribution(w.dominantWohnlage)}`
		);
	}
	if (w.dominantMss) {
		lines.push(
			`- MSS-Status (kategorisch, strukturelle Soziale Lage): ${w.dominantMss.value}${formatAttribution(w.dominantMss)}`
		);
		lines.push(
			'  - Hinweis: MSS misst strukturelle Indikatoren wie Einkommen, Beschäftigung, Bildung pro Planungsraum. Niedriger Status bedeutet nicht „schlechter Kiez", sondern strukturelle Unterschiede.'
		);
	}
	lines.push('');
}

function renderOepnv(stats: BezirkStats, lines: string[]): void {
	const o = stats.oepnv;
	if (!o.stopsPerKm2 && !o.uBahnCount && !o.sBahnCount && !o.tramCount && !o.busCount) return;
	lines.push('### ÖPNV');
	lines.push('');
	if (o.stopsPerKm2) {
		lines.push(
			`- Haltestellen-Dichte: ${formatNumberDe(o.stopsPerKm2.value)} pro km²${formatAttribution(o.stopsPerKm2)}`
		);
	}
	if (o.uBahnCount) {
		lines.push(
			`- U-Bahn-Stationen: ${formatNumberDe(o.uBahnCount.value)}${formatAttribution(o.uBahnCount)}`
		);
	}
	if (o.sBahnCount) {
		lines.push(
			`- S-Bahn-Stationen: ${formatNumberDe(o.sBahnCount.value)}${formatAttribution(o.sBahnCount)}`
		);
	}
	if (o.tramCount) {
		lines.push(
			`- Tram-Haltestellen: ${formatNumberDe(o.tramCount.value)}${formatAttribution(o.tramCount)}`
		);
	}
	if (o.busCount) {
		lines.push(
			`- Bus-Haltestellen: ${formatNumberDe(o.busCount.value)}${formatAttribution(o.busCount)}`
		);
	}
	lines.push('');
}

function renderBildung(stats: BezirkStats, lines: string[]): void {
	const b = stats.bildung;
	if (!b.kitasPerKm2 && !b.schulenPerKm2) return;
	lines.push('### Bildung');
	lines.push('');
	if (b.kitasPerKm2) {
		lines.push(
			`- Kitas pro km²: ${formatNumberDe(b.kitasPerKm2.value)}${formatAttribution(b.kitasPerKm2)}`
		);
	}
	if (b.schulenPerKm2) {
		lines.push(
			`- Schulen pro km²: ${formatNumberDe(b.schulenPerKm2.value)}${formatAttribution(b.schulenPerKm2)}`
		);
	}
	lines.push('');
}

/**
 * Rendert den Umwelt- & Infrastruktur-Score (ADR-015): Composite + Ruhe & Luft /
 * Grün & Hitze / Mobilität / Versorgung / Wohnschutz. Format identisch für Bezirk +
 * Kiez weil die Score-Tabellen denselben Shape haben. Sozialstruktur ist kein Score-Input.
 */
export interface ScoreLike {
	readonly composite: number;
	readonly ruheLuft: number | null;
	readonly gruenHitze: number | null;
	readonly mobilitaet: number | null;
	readonly versorgung: number | null;
	readonly wohnschutz: number | null;
	readonly kultur: number | null;
}

export function renderScoreSection(
	score: ScoreLike,
	heading: 'Bezirks-Score' | 'Kiez-Score',
	lines: string[]
): void {
	lines.push(`### ${heading} (Umwelt- & Infrastruktur-Score)`);
	lines.push('');
	lines.push(`- Composite: ${formatNumberDe(score.composite)}/100`);
	if (score.ruheLuft !== null) lines.push(`- Ruhe & Luft: ${formatNumberDe(score.ruheLuft)}/100`);
	if (score.gruenHitze !== null)
		lines.push(`- Grün & Hitze: ${formatNumberDe(score.gruenHitze)}/100`);
	if (score.mobilitaet !== null) lines.push(`- Mobilität: ${formatNumberDe(score.mobilitaet)}/100`);
	if (score.versorgung !== null) lines.push(`- Versorgung: ${formatNumberDe(score.versorgung)}/100`);
	if (score.wohnschutz !== null)
		lines.push(`- Wohnschutz: ${formatNumberDe(score.wohnschutz)}/100`);
	if (score.kultur !== null)
		lines.push(`- Kultur: ${formatNumberDe(score.kultur)}/100 (eigene Dimension, nicht im Composite)`);
	lines.push('');
	lines.push(
		'> Score misst nur Größen mit eindeutiger Besser-Richtung für Bewohner. Sozialstruktur und Bezahlbarkeit bewusst nicht enthalten. Methodik: /methodik/kiez-score.'
	);
	lines.push('');
}

export interface FaqEntry {
	readonly question: string;
	readonly answer: string;
}

export function renderFaqSection(faq: readonly FaqEntry[], lines: string[]): void {
	if (faq.length === 0) return;
	lines.push('### FAQ');
	lines.push('');
	for (const entry of faq) {
		lines.push(`**${entry.question}**`);
		lines.push('');
		lines.push(entry.answer);
		lines.push('');
	}
}
