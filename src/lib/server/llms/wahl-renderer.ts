/**
 * Story 6.9: Markdown-Renderer für Wahl-Detail-Pages in /llms-full.txt.
 *
 * Pro Wahl ein Markdown-Block: Hero + Berlin-Top-5 + Methodik-Verweis.
 * Sample-Daten pro Wahl-Typ helfen LLMs die Datenstruktur zu verstehen,
 * ohne dass 12 Bezirks-Tops aufgezählt werden müssen.
 */

import type { LlmsWahlEntry } from '$lib/seo/llms-builder.js';

export interface WahlMarkdownInput {
	readonly origin: string;
	readonly slug: string;
	readonly title: string;
	readonly jahr: number;
	readonly typ: 'btw' | 'agh' | 'bvv';
	readonly stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	readonly isRepeatElection: boolean;
	readonly sourceName: string;
	readonly license: string;
	readonly berlinTop5: ReadonlyArray<{
		readonly kurzname: string;
		readonly vollname: string;
		readonly stimmen: number;
		readonly anteil: number;
	}>;
}

const TYP_LABELS: Record<'btw' | 'agh' | 'bvv', string> = {
	btw: 'Bundestagswahl',
	agh: 'Abgeordnetenhauswahl',
	bvv: 'BVV-Wahl'
};

const STIMMTYP_LABELS: Record<'erststimme' | 'zweitstimme' | 'einstimme', string> = {
	erststimme: 'Erststimme',
	zweitstimme: 'Zweitstimme',
	einstimme: 'Stimme'
};

function formatPct(n: number): string {
	return `${(n * 100).toFixed(1).replace('.', ',')} %`;
}

function formatNum(n: number): string {
	return n.toLocaleString('de-DE');
}

export function buildWahlShortDescription(input: WahlMarkdownInput): string {
	const parts: string[] = [];
	parts.push(
		`${TYP_LABELS[input.typ]} ${input.jahr}${input.typ === 'bvv' ? '' : ` · ${STIMMTYP_LABELS[input.stimmtyp]}`}`
	);
	if (input.isRepeatElection) parts.push('Wiederholungswahl');
	parts.push(`Quelle ${input.sourceName}`);
	return parts.join(' · ');
}

export function renderWahlMarkdown(input: WahlMarkdownInput): string {
	const lines: string[] = [];
	lines.push(`## ${input.title}`);
	lines.push('');
	lines.push(`URL: ${input.origin}/wahl/${input.slug}`);
	lines.push('');
	lines.push(`Jahr: ${input.jahr}. Wahltyp: ${TYP_LABELS[input.typ]}.`);
	if (input.typ !== 'bvv') {
		lines.push(`Stimmtyp: ${STIMMTYP_LABELS[input.stimmtyp]}.`);
	}
	if (input.isRepeatElection) {
		lines.push(
			'Wiederholungswahl: ja. Ergebnisse weichen von der gerichtlich aufgehobenen Original-Wahl ab.'
		);
	}
	lines.push(`Quelle: ${input.sourceName}. Lizenz: ${input.license}.`);
	lines.push('');

	if (input.berlinTop5.length > 0) {
		lines.push('### Berlin gesamt · Top-5-Parteien');
		lines.push('');
		lines.push('| Rang | Partei | Stimmen | Anteil |');
		lines.push('|---|---|---:|---:|');
		input.berlinTop5.forEach((p, i) => {
			lines.push(
				`| ${i + 1} | ${p.vollname} (${p.kurzname}) | ${formatNum(p.stimmen)} | ${formatPct(p.anteil)} |`
			);
		});
		lines.push('');
	}

	lines.push(
		'Werte sind Stimmenanteile, keine Bewertung. Brief-Stimmen sind nur in Bezirk + Berlin-Aggregat enthalten, nicht in den einzelnen Stimmbezirken pre-2021.'
	);
	lines.push('');
	lines.push(`Methodik: ${input.origin}/methodik/wahldaten`);
	return lines.join('\n');
}

export function buildWahlEntry(input: WahlMarkdownInput): LlmsWahlEntry {
	return {
		slug: input.slug,
		name: input.title,
		short: buildWahlShortDescription(input),
		markdown: renderWahlMarkdown(input)
	};
}
