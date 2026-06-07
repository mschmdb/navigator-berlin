import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';

/**
 * Liest das committete KI-Profil (Story 11.6) für eine Kiez/Bezirks-Seite und
 * gibt die Absätze als String-Array zurück. Leeres Array, wenn kein Profil
 * existiert (graceful, Seite rendert dann ohne Profil-Sektion).
 *
 * Reine Datei-Lese-Operation zur Prerender-Zeit; keine LLM/API zur Laufzeit.
 */
export async function getProfileParagraphs(
	pageType: 'kiez' | 'bezirk',
	slug: string
): Promise<string[]> {
	const path = resolve(process.cwd(), 'src/lib/content', `${pageType}-profile`, `${slug}.md`);
	if (!existsSync(path)) return [];
	try {
		const { content } = matter(await readFile(path, 'utf-8'));
		return content
			.split(/\n\s*\n/)
			.map((p) => p.trim())
			.filter((p) => p.length > 0);
	} catch {
		return [];
	}
}
