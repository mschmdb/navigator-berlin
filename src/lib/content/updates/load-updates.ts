import matter from 'gray-matter';
import { parseFrontmatter, type UpdateFrontmatter } from './frontmatter-schema.js';
import type { UpdateEntry } from './types.js';

/**
 * Story 2.13 AC-1 + AC-2 + AC-3 + T2: Build-Time-Load-Helper für Update-Entries.
 *
 * Verwendung in `+page.server.ts`:
 * ```ts
 * const modules = import.meta.glob('/_content/updates/*.md', {
 *   eager: true, query: '?raw', import: 'default'
 * });
 * const entries = loadUpdatesFromModules(modules);
 * ```
 *
 * Pure-Function-Helper (kein I/O), damit tests fixture-basiert laufen.
 */

const FILENAME_REGEX = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;

/**
 * Strippt `YYYY-MM-DD-` Prefix + `.md`-Suffix aus Datei-Pfad.
 * Wirft bei Filename ohne Date-Prefix (verletzt Naming-Convention AC-1).
 */
export function extractSlugFromPath(path: string): string {
	const filename = path.split('/').pop() ?? path;
	const match = FILENAME_REGEX.exec(filename);
	if (!match) {
		throw new Error(
			`Update-Datei verletzt Naming-Pattern YYYY-MM-DD-{slug}.md: ${path}`
		);
	}
	return match[2] ?? '';
}

/**
 * Parsed eine einzelne MD-Datei (Raw-Content) zu einem typed UpdateEntry.
 * Frontmatter wird gegen Valibot-Schema validiert. Build-Fehler bei Verstoß.
 */
export function parseUpdateModule(path: string, raw: string): UpdateEntry {
	const slug = extractSlugFromPath(path);
	let parsed: matter.GrayMatterFile<string>;
	try {
		parsed = matter(raw);
	} catch (err) {
		throw new Error(
			`Update-MD-Parse-Fehler in ${path}: ${(err as Error).message}`
		);
	}
	// gray-matter parsed YAML `2026-05-15` als JS-Date-Object. Coerce zurück zu ISO-String.
	const normalised = normaliseDateFields(parsed.data);
	let frontmatter: UpdateFrontmatter;
	try {
		frontmatter = parseFrontmatter(normalised);
	} catch (err) {
		throw new Error(`Update-Frontmatter-Fehler in ${path}: ${(err as Error).message}`);
	}
	return {
		slug,
		filePath: path,
		frontmatter,
		body: parsed.content.trim()
	};
}

/**
 * Konvertiert die `import.meta.glob`-Resultat-Map zu typed UpdateEntries.
 * Reihenfolge: chronologisch absteigend nach Frontmatter `date`.
 */
export function loadUpdatesFromModules(
	modules: Record<string, unknown>
): UpdateEntry[] {
	const entries: UpdateEntry[] = [];
	for (const [path, raw] of Object.entries(modules)) {
		// README + nicht-Date-prefixed Files überspringen (Maintainer-Convention).
		const filename = path.split('/').pop() ?? path;
		if (!FILENAME_REGEX.test(filename)) continue;
		if (typeof raw !== 'string') {
			throw new Error(
				`Update-Loader: Modul ${path} ist kein Raw-String. Vergessen \`query: '?raw'\` zu setzen?`
			);
		}
		entries.push(parseUpdateModule(path, raw));
	}
	return sortByDateDesc(entries);
}

/**
 * Returns NEW array sorted neuestes-Datum-zuerst. Stable secondary-sort über slug.
 */
export function sortByDateDesc(entries: readonly UpdateEntry[]): UpdateEntry[] {
	return [...entries].sort((a, b) => {
		if (a.frontmatter.date !== b.frontmatter.date) {
			return a.frontmatter.date < b.frontmatter.date ? 1 : -1;
		}
		return a.slug < b.slug ? -1 : 1;
	});
}

/**
 * YAML parsed `YYYY-MM-DD` per JS-Engine als Date-Object. Wir wollen aber den
 * String exakt wie in der MD-Datei (Schema-Regex prüft auf String-Format).
 */
function normaliseDateFields(data: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = { ...data };
	const dateValue = out.date;
	if (dateValue instanceof Date) {
		// UTC-ISO date Anteil, kein TZ-Shift
		const iso = dateValue.toISOString().slice(0, 10);
		out.date = iso;
	}
	return out;
}

/**
 * Top-N neueste Entries. Wenn n > length, liefert alle.
 */
export function latestUpdates(
	entries: readonly UpdateEntry[],
	n: number
): UpdateEntry[] {
	return sortByDateDesc(entries).slice(0, Math.max(0, n));
}
