import matter from 'gray-matter';
import { parseFrontmatter, type UpdateFrontmatter } from './frontmatter-schema.js';
import type { UpdateEntry } from './types.js';
import { classifyUpdateFilename, filenameOf } from './update-filename.js';

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

/**
 * Strippt `YYYY-MM-DD-` Prefix + `.md`-Suffix aus Datei-Pfad.
 * Wirft bei Filename ohne Date-Prefix (verletzt Naming-Convention AC-1).
 */
export function extractSlugFromPath(path: string): string {
	const parsed = classifyUpdateFilename(filenameOf(path));
	if (parsed.kind === 'en') {
		throw new Error(`Update-Loader: EN-Schwester ist kein eigener Eintrag: ${path}`);
	}
	if (parsed.kind !== 'de') {
		throw new Error(`Update-Datei verletzt Naming-Pattern YYYY-MM-DD-{slug}.md: ${path}`);
	}
	return parsed.slug;
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
		throw new Error(`Update-MD-Parse-Fehler in ${path}: ${(err as Error).message}`);
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
export function loadUpdatesFromModules(modules: Record<string, unknown>): UpdateEntry[] {
	const entries: UpdateEntry[] = [];
	const sisters = new Map<string, { path: string; bodyEn: string }>();
	for (const [path, raw] of Object.entries(modules)) {
		// README + nicht-Date-prefixed Files überspringen (Maintainer-Convention).
		const parsed = classifyUpdateFilename(filenameOf(path));
		if (parsed.kind === 'other-locale') {
			throw new Error(`Update-Loader: Locale-Suffix wird nicht unterstützt (nur .en.md): ${path}`);
		}
		if (parsed.kind === 'ignored') continue;
		if (typeof raw !== 'string') {
			throw new Error(
				`Update-Loader: Modul ${path} ist kein Raw-String. Vergessen \`query: '?raw'\` zu setzen?`
			);
		}
		if (parsed.kind === 'en') {
			if (/^\uFEFF?---\s*(\r?\n|$)/.test(raw)) {
				throw new Error(`Update-Loader: EN-Schwester darf kein Frontmatter haben: ${path}`);
			}
			sisters.set(parsed.key, { path, bodyEn: raw.trim() });
			continue;
		}
		entries.push(parseUpdateModule(path, raw));
	}
	return sortByDateDesc(attachEnglishBodies(entries, sisters));
}

/**
 * Ordnet jede EN-Schwester dem DE-Eintrag mit gleichem `YYYY-MM-DD-<slug>` zu.
 * Eine Schwester ohne DE-Datei wirft (Build-Fehler mit Pfad). Eine leere
 * Schwester oder ein Eintrag ohne `title_en`/`summary_en` wirft ebenfalls:
 * Das Übersetzungsregister wertet jede `.en.md` als übersetzt, die EN-Seite
 * würde sonst indexierbar mit DE-Text ausgeliefert.
 */
function attachEnglishBodies(
	entries: readonly UpdateEntry[],
	sisters: ReadonlyMap<string, { path: string; bodyEn: string }>
): UpdateEntry[] {
	const remaining = new Map(sisters);
	const out = entries.map((entry) => {
		const key = filenameOf(entry.filePath).replace(/\.md$/, '');
		const sister = remaining.get(key);
		if (!sister) return entry;
		remaining.delete(key);
		assertEnglishComplete(entry, sister);
		return { ...entry, bodyEn: sister.bodyEn };
	});
	const orphan = remaining.values().next().value;
	if (orphan) {
		throw new Error(`Update-Loader: EN-Schwester ohne DE-Datei: ${orphan.path}`);
	}
	return out;
}

function assertEnglishComplete(entry: UpdateEntry, sister: { path: string; bodyEn: string }): void {
	const missing: string[] = [];
	if (!sister.bodyEn) missing.push('Body');
	if (!entry.frontmatter.title_en?.trim()) missing.push('title_en');
	if (!entry.frontmatter.summary_en?.trim()) missing.push('summary_en');
	if (missing.length > 0) {
		throw new Error(
			`Update-Loader: EN-Fassung unvollständig (${missing.join(', ')} fehlt): ${sister.path}`
		);
	}
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
	for (const key of ['date', 'updated'] as const) {
		const value = out[key];
		if (value instanceof Date) {
			// UTC-ISO date Anteil, kein TZ-Shift
			out[key] = value.toISOString().slice(0, 10);
		}
	}
	return out;
}

/**
 * Top-N neueste Entries. Wenn n > length, liefert alle.
 */
export function latestUpdates(entries: readonly UpdateEntry[], n: number): UpdateEntry[] {
	return sortByDateDesc(entries).slice(0, Math.max(0, n));
}
