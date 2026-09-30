import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import type { Locale } from '$lib/paraglide/runtime.js';
import { hashProfileParagraphs, splitParagraphs } from './source-text-hash.js';

export interface LocalizedProfile {
	readonly paragraphs: string[];
	/** Sprache der gelieferten Absätze (bei Fallback `de`, auch auf `/en`). */
	readonly locale: Locale;
}

const DEFAULT_ROOT = (): string => resolve(process.cwd(), 'src/lib/content');

async function readProfileFile(path: string) {
	if (!existsSync(path)) return null;
	try {
		return matter(await readFile(path, 'utf-8'));
	} catch {
		return null;
	}
}

/**
 * Liest das committete KI-Profil (Story 11.6, i18n Block C5) in der Seiten-Locale.
 * `<slug>.en.md` gilt nur, wenn `sourceInputHash` dem `inputHash` und
 * `sourceTextHash` dem Text-Hash der DE-Datei entspricht. Sonst (fehlt, veraltet, DE-Locale) liefert die Funktion die
 * DE-Fassung mit `locale: 'de'`, damit die Seite `lang="de"` setzen kann.
 * Leeres Array, wenn keine DE-Datei existiert (Seite rendert ohne Profil-Sektion).
 *
 * Reine Datei-Lese-Operation zur Prerender-Zeit; keine LLM/API zur Laufzeit.
 */
export async function getLocalizedProfile(
	pageType: 'kiez' | 'bezirk',
	slug: string,
	locale: Locale,
	contentRoot: string = DEFAULT_ROOT()
): Promise<LocalizedProfile> {
	const dir = resolve(contentRoot, `${pageType}-profile`);
	const deFile = await readProfileFile(resolve(dir, `${slug}.md`));
	if (!deFile) return { paragraphs: [], locale: 'de' };
	const dePayload: LocalizedProfile = {
		paragraphs: splitParagraphs(deFile.content),
		locale: 'de'
	};
	if (locale !== 'en') return dePayload;

	const enFile = await readProfileFile(resolve(dir, `${slug}.en.md`));
	if (!enFile) return dePayload;
	const deHash = deFile.data.inputHash;
	if (typeof deHash !== 'string' || enFile.data.sourceInputHash !== deHash) return dePayload;
	if (enFile.data.sourceTextHash !== hashProfileParagraphs(dePayload.paragraphs)) return dePayload;
	const paragraphs = splitParagraphs(enFile.content);
	return paragraphs.length > 0 ? { paragraphs, locale: 'en' } : dePayload;
}

/** DE-Absätze für Nicht-UI-Konsumenten (llms-Export). */
export async function getProfileParagraphs(
	pageType: 'kiez' | 'bezirk',
	slug: string,
	contentRoot: string = DEFAULT_ROOT()
): Promise<string[]> {
	return (await getLocalizedProfile(pageType, slug, 'de', contentRoot)).paragraphs;
}
