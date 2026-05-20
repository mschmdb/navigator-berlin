/**
 * Story 2.8 AC-3 / T1.4: Site-Intro-Renderer für /llms.txt + /llms-full.txt.
 *
 * Liefert das H1 + Blockquote-Summary nach llmstxt.org-Spec.
 *
 * Boundary: pure function, kein I/O. Liegt unter `$lib/server/` aus Symmetrie zu
 * den anderen Renderern (Bezirk/Kiez/Layer brauchen DB-Access), nicht weil hier
 * Server-only-Code wäre. Falls die Symmetrie irrelevant wird, kann das File
 * problemlos nach `$lib/seo/` wandern.
 */

export interface SiteIntroInput {
	readonly origin: string;
}

/**
 * Rendert das Site-Intro für `/llms.txt`.
 *
 * Struktur:
 * - H1 mit Site-Name
 * - Blockquote-Summary (1-2 Sätze, llmstxt.org-Konvention)
 *
 * Keine em-dashes (Memory `feedback_no_em_dashes`). Kein „lebenswert"
 * (Memory `feedback_no_lebenswert`).
 */
export function renderSiteIntroMarkdown(_input: SiteIntroInput): string {
	const lines: string[] = [];
	lines.push('# navigator.berlin');
	lines.push('');
	lines.push(
		'> Berliner Geo-Daten-Atlas mit rund 39 Layern aus offiziellen Quellen (ODIS Berlin, Umweltatlas, DWD, OpenStreetMap). Adress-Inspektor zeigt Wohn-, Umwelt-, Klima- und Mobilitäts-Daten pro Adresse. Cookieless, Open-Source-Stack, vollständig statisch ausgeliefert.'
	);
	lines.push('');
	return lines.join('\n');
}
