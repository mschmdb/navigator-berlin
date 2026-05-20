/**
 * Story 2.8 AC-5 / T3.1: Builder-Bibliothek für /llms.txt + /llms-full.txt.
 *
 * Pure functions, kein I/O. Endpoints liefern den `LlmsSourceContext` aus DB +
 * Manifest und rufen `buildLlmsTxt(ctx)` / `buildLlmsFullTxt(ctx)`.
 *
 * Konsistenz mit `sitemap-builder.ts` (Story 2.1): URL-Liste fließt durch
 * `collectLlmsSourceEntries` mit dem gleichen URL-Pattern wie die Sitemap-
 * Sources (`STATIC_PAGES_SOURCE` + `LAYER_DETAIL_SOURCE`) plus Bezirks- + Kiez-
 * Pages aus der DB. Der Konsistenz-Test stellt sicher dass beide Builder
 * dieselben Page-URLs aufzählen.
 *
 * Phase 1 (DE-only, Memory `project_i18n_phase_1_de_only`): nur `locale: 'de'`
 * liefert URLs. EN bleibt leer.
 *
 * Variante-B-Skalierung (User-Decision): Top-50 Kieze in /llms-full.txt nach
 * `topRank`, Rest nur als URL-Referenz am Ende.
 */

import type { Manifest } from '$lib/data/types.js';
import type { SitemapLocale } from './sitemap-builder.js';

export const KIEZ_FULL_TXT_CAP = 50;

export interface LlmsBezirkEntry {
	readonly slug: string;
	readonly name: string;
	/** Pre-rendered markdown block for /llms-full.txt */
	readonly markdown: string;
	/** Optional kurze description für /llms.txt-Bullet. Default = generischer Fallback. */
	readonly description?: string;
}

export interface LlmsKiezEntry {
	readonly slug: string;
	readonly name: string;
	readonly bezirkSlug: string;
	readonly markdown: string;
	/** Sortierung für Top-50-Cap. Kleinere Werte zuerst (1 = höchster Rank). */
	readonly topRank: number;
	readonly description?: string;
}

export interface LlmsLayerEntry {
	readonly slug: string;
	readonly name: string;
	readonly short: string;
	readonly markdown: string;
}

export interface LlmsWahlEntry {
	readonly slug: string;
	readonly name: string;
	readonly short: string;
	readonly markdown: string;
}

export interface LlmsSourceContext {
	readonly origin: string;
	readonly locale: SitemapLocale;
	readonly manifest: Manifest;
	readonly buildTimestamp: string;
	readonly bezirke: readonly LlmsBezirkEntry[];
	readonly kieze: readonly LlmsKiezEntry[];
	readonly layer: readonly LlmsLayerEntry[];
	readonly wahlen?: readonly LlmsWahlEntry[];
}

export interface LlmsSourceEntry {
	readonly loc: string;
	readonly name: string;
	readonly description: string;
	readonly section: 'methodik' | 'bezirk' | 'kiez' | 'layer' | 'static' | 'lizenzen' | 'wahl';
}

const SECTION_DEFAULTS: Record<LlmsSourceEntry['section'], string> = {
	methodik: 'Methodik-Erklärung',
	bezirk: 'Bezirks-Steckbrief mit Cross-Layer-Daten',
	kiez: 'Kiez-Steckbrief (LOR-Bezirksregion)',
	layer: 'Daten-Layer',
	static: 'Statische Seite',
	lizenzen: 'Lizenz + Quellen pro Layer',
	wahl: 'Wahl-Ergebnis pro Bezirk und Berlin gesamt'
};

function buildSiteIntro(): string[] {
	return [
		'# navigator.berlin',
		'',
		'> Berliner Geo-Daten-Atlas mit rund 39 Layern aus offiziellen Quellen (ODIS Berlin, Umweltatlas, DWD, OpenStreetMap). Adress-Inspektor zeigt Wohn-, Umwelt-, Klima- und Mobilitäts-Daten pro Adresse. Cookieless, Open-Source-Stack, vollständig statisch ausgeliefert.',
		''
	];
}

/**
 * Sammelt alle Page-URLs für Konsistenz-Check gegen Sitemap.
 *
 * Spiegelt die Sitemap-Source-Liste (Static + Layer) und ergänzt um Bezirk-,
 * Kiez-Pages aus DB. Phase 1 DE-only: für `locale !== 'de'` leeres Array.
 */
export function collectLlmsSourceEntries(ctx: LlmsSourceContext): LlmsSourceEntry[] {
	if (ctx.locale !== 'de') return [];

	const out: LlmsSourceEntry[] = [];

	// Static pages
	out.push({
		loc: `${ctx.origin}/`,
		name: 'Startseite',
		description: 'Hero-Landing mit Einstieg in Atlas + Daten-Themen',
		section: 'static'
	});
	out.push({
		loc: `${ctx.origin}/explore`,
		name: 'Atlas',
		description: 'Karten-Inspector mit Adress-Suche und 38 Daten-Layern',
		section: 'static'
	});
	out.push({
		loc: `${ctx.origin}/wo-lebt-es-sich-gut`,
		name: 'Kiez-Score-Ranking',
		description: 'Alle 143 Kieze und 12 Bezirke nach 5 Dimensionen sortierbar',
		section: 'static'
	});
	out.push({
		loc: `${ctx.origin}/methodik`,
		name: 'Methodik',
		description: 'Wie Daten verarbeitet werden, was wir bewusst weglassen',
		section: 'methodik'
	});
	out.push({
		loc: `${ctx.origin}/webmcp`,
		name: 'WebMCP',
		description:
			'Schnittstelle für KI-Assistenten: Spec-Status, Browser-Support, Tools und Chrome-Canary-Anleitung',
		section: 'static'
	});
	out.push({
		loc: `${ctx.origin}/methodik/wahldaten`,
		name: 'Methodik · Wahldaten',
		description:
			'Datenquellen, Daten-Cutoff, Briefwahl-Asymmetrie, Stimmbezirks-zu-Kiez-Aggregation, Wiederholungswahl 2023',
		section: 'methodik'
	});
	out.push({
		loc: `${ctx.origin}/lizenzen`,
		name: 'Lizenzen',
		description: 'Pro Layer Lizenz und Authority',
		section: 'lizenzen'
	});

	// Bezirke
	for (const b of ctx.bezirke) {
		out.push({
			loc: `${ctx.origin}/bezirk/${b.slug}`,
			name: b.name,
			description: b.description ?? SECTION_DEFAULTS.bezirk,
			section: 'bezirk'
		});
	}

	// Kieze (alle, sortiert nach topRank für deterministische Reihenfolge)
	const sortedKieze = [...ctx.kieze].sort((a, b) => a.topRank - b.topRank);
	for (const k of sortedKieze) {
		out.push({
			loc: `${ctx.origin}/kiez/${k.slug}`,
			name: k.name,
			description: k.description ?? SECTION_DEFAULTS.kiez,
			section: 'kiez'
		});
	}

	// Layer (alle aus Manifest)
	for (const l of ctx.manifest.layers) {
		const entry = ctx.layer.find((e) => e.slug === l.slug);
		out.push({
			loc: `${ctx.origin}/layer/${l.slug}`,
			name: entry?.name ?? l.slug,
			description: entry?.short ?? SECTION_DEFAULTS.layer,
			section: 'layer'
		});
	}

	// Wahl-Index + Detail-Pages (Story 6.4)
	if (ctx.wahlen && ctx.wahlen.length > 0) {
		out.push({
			loc: `${ctx.origin}/wahl`,
			name: 'Wahl-Übersicht',
			description: 'Alle abgedeckten Berliner Wahlen seit 2011',
			section: 'wahl'
		});
		for (const w of ctx.wahlen) {
			out.push({
				loc: `${ctx.origin}/wahl/${w.slug}`,
				name: w.name,
				description: w.short,
				section: 'wahl'
			});
		}
	}

	return out;
}

function pushBullet(lines: string[], entry: LlmsSourceEntry): void {
	const desc = entry.description.trim();
	if (desc) {
		lines.push(`- [${entry.name}](${entry.loc}): ${desc}`);
	} else {
		lines.push(`- [${entry.name}](${entry.loc})`);
	}
}

/**
 * Rendert /llms.txt als Site-Index nach llmstxt.org-Spec.
 *
 * Struktur:
 * - H1 Site-Name
 * - Blockquote-Summary
 * - H2 Methodik (Liste)
 * - H2 Bezirke (Liste)
 * - H2 Kieze (Liste, alle)
 * - H2 Daten-Layer (Liste)
 * - H2 Lizenz + Quellen
 */
export function buildLlmsTxt(ctx: LlmsSourceContext): string {
	const entries = collectLlmsSourceEntries(ctx);
	const lines: string[] = [];
	lines.push(...buildSiteIntro());

	const methodik = entries.filter((e) => e.section === 'methodik');
	const bezirke = entries.filter((e) => e.section === 'bezirk');
	const kieze = entries.filter((e) => e.section === 'kiez');
	const layer = entries.filter((e) => e.section === 'layer');
	const lizenzen = entries.filter((e) => e.section === 'lizenzen');

	if (methodik.length > 0) {
		lines.push('## Methodik');
		lines.push('');
		for (const e of methodik) pushBullet(lines, e);
		lines.push('');
	}

	if (bezirke.length > 0) {
		lines.push('## Bezirke');
		lines.push('');
		for (const e of bezirke) pushBullet(lines, e);
		lines.push('');
	}

	if (kieze.length > 0) {
		lines.push('## Kieze');
		lines.push('');
		for (const e of kieze) pushBullet(lines, e);
		lines.push('');
	}

	if (layer.length > 0) {
		lines.push('## Daten-Layer');
		lines.push('');
		for (const e of layer) pushBullet(lines, e);
		lines.push('');
	}

	const wahl = entries.filter((e) => e.section === 'wahl');
	if (wahl.length > 0) {
		lines.push('## Wahldaten');
		lines.push('');
		for (const e of wahl) pushBullet(lines, e);
		lines.push('');
	}

	if (lizenzen.length > 0) {
		lines.push('## Lizenz + Quellen');
		lines.push('');
		for (const e of lizenzen) pushBullet(lines, e);
		lines.push('');
	}

	// Optional-Section (Spec): URLs die optional / nicht-Pflicht sind
	lines.push('## Optional');
	lines.push('');
	lines.push(
		`- [WebMCP-Manifest](${ctx.origin}/webmcp-manifest.json): Tools + Resources für LLM-Agenten`
	);
	lines.push('');

	return lines.join('\n');
}

const SECTION_MARKER = '\n\n---\n\n';

/**
 * Rendert /llms-full.txt als Single-File-Concat aller Page-Markdowns.
 *
 * Top-50-Cap (User-Decision): Top-50 Kieze nach `topRank` mit vollem Markdown,
 * Rest nur als URL-Referenz im finalen „Weitere Kieze"-Block. Verhindert
 * Context-Sprengung bei Story-2.4-Variante-B (1.084 Kieze).
 */
export function buildLlmsFullTxt(ctx: LlmsSourceContext): string {
	const lines: string[] = [];
	lines.push(...buildSiteIntro());

	// Bezirke (alle, alphabetisch nach Slug für deterministische Reihenfolge)
	const bezirke = [...ctx.bezirke].sort((a, b) => a.slug.localeCompare(b.slug));
	for (const b of bezirke) {
		lines.push(SECTION_MARKER.trim());
		lines.push('');
		lines.push(b.markdown.trim());
		lines.push('');
	}

	// Kieze: Top-50 mit vollem Markdown, Rest als URL-only-Referenz
	const sortedKieze = [...ctx.kieze].sort((a, b) => a.topRank - b.topRank);
	const topKieze = sortedKieze.slice(0, KIEZ_FULL_TXT_CAP);
	const overflowKieze = sortedKieze.slice(KIEZ_FULL_TXT_CAP);

	for (const k of topKieze) {
		lines.push(SECTION_MARKER.trim());
		lines.push('');
		lines.push(k.markdown.trim());
		lines.push('');
	}

	if (overflowKieze.length > 0) {
		lines.push(SECTION_MARKER.trim());
		lines.push('');
		lines.push('## Weitere Kieze (nur URL-Referenz)');
		lines.push('');
		lines.push(
			`> Phase 1 enthält die Top-${KIEZ_FULL_TXT_CAP} Kieze nach Score-Ranking als vollen Markdown-Block. Die folgenden ${overflowKieze.length} Kieze sind nur als URL gelistet. Volle Inhalte über die einzelnen Page-URLs abrufbar.`
		);
		lines.push('');
		for (const k of overflowKieze) {
			lines.push(`- [${k.name}](${ctx.origin}/kiez/${k.slug})`);
		}
		lines.push('');
	}

	// Layer-Detail-Markdowns
	for (const l of ctx.layer) {
		lines.push(SECTION_MARKER.trim());
		lines.push('');
		lines.push(l.markdown.trim());
		lines.push('');
	}

	// Wahl-Detail-Markdowns (Story 6.9)
	if (ctx.wahlen && ctx.wahlen.length > 0) {
		for (const w of ctx.wahlen) {
			lines.push(SECTION_MARKER.trim());
			lines.push('');
			lines.push(w.markdown.trim());
			lines.push('');
		}
	}

	return lines.join('\n');
}
