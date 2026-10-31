import matter from 'gray-matter';
import { classifyUpdateFilename, filenameOf } from '$lib/content/updates/update-filename.js';
import { parseStoryFrontmatter } from './frontmatter-schema.js';
import type { StoryEntry } from './types.js';

/**
 * Lädt Beiträge aus `import.meta.glob('/_content/stories/*.md', { query: '?raw' })`.
 * Dateinamen folgen `YYYY-MM-DD-<slug>.md`, die EN-Fassung heißt `YYYY-MM-DD-<slug>.en.md`
 * und trägt kein Frontmatter. Verstöße sind Build-Fehler.
 */

interface Sister {
	readonly path: string;
	readonly bodyEn: string;
}

function parseStory(path: string, slug: string, raw: string): StoryEntry {
	let parsed: matter.GrayMatterFile<string>;
	try {
		parsed = matter(raw);
	} catch (err) {
		throw new Error(`Story-MD-Parse-Fehler in ${path}: ${(err as Error).message}`, { cause: err });
	}
	const data: Record<string, unknown> = { ...parsed.data };
	// YAML liest `2026-10-31` als Date. Das Schema erwartet den String.
	if (data.date instanceof Date) data.date = data.date.toISOString().slice(0, 10);
	try {
		return {
			slug,
			filePath: path,
			frontmatter: parseStoryFrontmatter(data),
			body: parsed.content.trim()
		};
	} catch (err) {
		throw new Error(`Story-Frontmatter-Fehler in ${path}: ${(err as Error).message}`, {
			cause: err
		});
	}
}

function attachEnglish(
	entries: readonly StoryEntry[],
	sisters: ReadonlyMap<string, Sister>
): StoryEntry[] {
	const remaining = new Map(sisters);
	const out = entries.map((entry) => {
		const key = filenameOf(entry.filePath).replace(/\.md$/, '');
		const sister = remaining.get(key);
		if (!sister) return entry;
		remaining.delete(key);
		const missing: string[] = [];
		if (!sister.bodyEn) missing.push('Body');
		if (!entry.frontmatter.title_en?.trim()) missing.push('title_en');
		if (!entry.frontmatter.summary_en?.trim()) missing.push('summary_en');
		if (missing.length > 0) {
			throw new Error(
				`Story-Loader: EN-Fassung unvollständig (${missing.join(', ')} fehlt): ${sister.path}`
			);
		}
		return { ...entry, bodyEn: sister.bodyEn };
	});
	const orphan = remaining.values().next().value;
	if (orphan) throw new Error(`Story-Loader: EN-Schwester ohne DE-Datei: ${orphan.path}`);
	return out;
}

/** Neueste zuerst, bei gleichem Datum alphabetisch nach Slug. */
export function sortStoriesByDateDesc(entries: readonly StoryEntry[]): StoryEntry[] {
	return [...entries].sort((a, b) => {
		if (a.frontmatter.date !== b.frontmatter.date) {
			return a.frontmatter.date < b.frontmatter.date ? 1 : -1;
		}
		return a.slug < b.slug ? -1 : 1;
	});
}

export function loadStoriesFromModules(modules: Record<string, unknown>): StoryEntry[] {
	const entries: StoryEntry[] = [];
	const sisters = new Map<string, Sister>();
	for (const [path, raw] of Object.entries(modules)) {
		const file = classifyUpdateFilename(filenameOf(path));
		if (file.kind === 'other-locale') {
			throw new Error(`Story-Loader: Locale-Suffix wird nicht unterstützt (nur .en.md): ${path}`);
		}
		if (file.kind === 'ignored') continue;
		if (typeof raw !== 'string') {
			throw new Error(`Story-Loader: Modul ${path} ist kein Raw-String (query: '?raw' fehlt?)`);
		}
		if (file.kind === 'en') {
			if (/^\uFEFF?---\s*(\r?\n|$)/.test(raw)) {
				throw new Error(`Story-Loader: EN-Schwester darf kein Frontmatter haben: ${path}`);
			}
			sisters.set(file.key, { path, bodyEn: raw.trim() });
			continue;
		}
		entries.push(parseStory(path, file.slug, raw));
	}
	return sortStoriesByDateDesc(attachEnglish(entries, sisters));
}
