/**
 * Teilt den Markdown-Text eines Beitrags an Markern `<!-- abschnitt: <id> -->` in
 * Abschnitte. Die Seite rendert jeden Abschnitt für sich und hängt je nach ID ein
 * interaktives Beispiel an (Handbuch „Berlin in Quadraten“, #190). Text vor dem ersten
 * Marker bekommt die ID `null`. Ein Marker gilt nur auf eigener Zeile.
 */
const MARKER = /^[ \t]*<!--\s*abschnitt:\s*([a-z0-9-]+)\s*-->[ \t]*$/gm;

export interface StorySection {
	readonly id: string | null;
	readonly markdown: string;
}

export function splitSections(body: string): StorySection[] {
	const out: StorySection[] = [];
	const seen = new Set<string>();
	let id: string | null = null;
	let start = 0;
	const push = (end: number): void => {
		const markdown = body.slice(start, end).trim();
		if (id !== null || markdown) out.push({ id, markdown });
	};
	for (const match of body.matchAll(MARKER)) {
		push(match.index);
		id = match[1];
		if (seen.has(id)) throw new Error(`Abschnitt ${id} doppelt`);
		seen.add(id);
		start = match.index + match[0].length;
	}
	push(body.length);
	return out;
}
