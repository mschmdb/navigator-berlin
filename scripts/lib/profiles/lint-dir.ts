import matter from 'gray-matter';
import {
	hashProfileParagraphs,
	splitParagraphs
} from '../../../src/lib/server/profile/source-text-hash.js';
import { classifyEnProfile } from './en-status.js';
import { factLint, type LintLocale } from './fact-lint.js';
import type { ProfileInput } from './input.js';

export interface ProfileFile {
	readonly name: string;
	readonly raw: string;
}

export interface BuiltRef {
	readonly inputHash: string;
	readonly input: ProfileInput;
}

export interface LocaleCounts {
	checked: number;
	failed: number;
	stale: number;
}

export interface LintDirResult {
	readonly de: LocaleCounts;
	readonly en: LocaleCounts;
	readonly messages: string[];
}

interface Params {
	readonly pageType: 'kiez' | 'bezirk';
	readonly files: readonly ProfileFile[];
	readonly byKey: ReadonlyMap<string, BuiltRef>;
}

const EN_SUFFIX = /\.en\.md$/;

function describeLint(text: string, input: ProfileInput, locale: LintLocale): string | null {
	const res = factLint(text, input, locale);
	if (res.ok) return null;
	const parts: string[] = [];
	if (res.unbackedNumbers.length > 0)
		parts.push(`ungedeckte Zahlen: ${res.unbackedNumbers.join(', ')}`);
	if (res.hasDash) parts.push('Gedankenstrich gefunden');
	if (res.stigmaHits.length > 0)
		parts.push(`Stigma-Begriffe (Kriminalität/Sicherheit): ${res.stigmaHits.join(', ')}`);
	return parts.join('; ');
}

/**
 * Lint eines Profil-Verzeichnisses (DE `<slug>.md` + EN `<slug>.en.md`), rein
 * über Dateiinhalte. Der Runner `lint-profiles.ts` liest Files + DB.
 */
export function lintProfileDir({ pageType, files, byKey }: Params): LintDirResult {
	const de: LocaleCounts = { checked: 0, failed: 0, stale: 0 };
	const en: LocaleCounts = { checked: 0, failed: 0, stale: 0 };
	const messages: string[] = [];
	const tag = (loc: 'de' | 'en') => (loc === 'en' ? 'EN ' : '');
	const fail = (loc: 'de' | 'en', slug: string, msg: string) => {
		(loc === 'en' ? en : de).failed += 1;
		messages.push(`[lint:profiles] FAIL ${tag(loc)}${pageType}/${slug}: ${msg}`);
	};
	const stale = (loc: 'de' | 'en', slug: string, msg: string) => {
		(loc === 'en' ? en : de).stale += 1;
		messages.push(`[lint:profiles] STALE ${tag(loc)}${pageType}/${slug}: ${msg}`);
	};

	const deFiles = files.filter((f) => f.name.endsWith('.md') && !EN_SUFFIX.test(f.name));
	const enFiles = files.filter((f) => EN_SUFFIX.test(f.name));
	const deByBase = new Map<string, { inputHash?: string; paragraphs: string[] }>();

	for (const file of deFiles) {
		const base = file.name.replace(/\.md$/, '');
		const fm = matter(file.raw);
		const slug = typeof fm.data.slug === 'string' ? fm.data.slug : base;
		deByBase.set(base, {
			inputHash: fm.data.inputHash as string | undefined,
			paragraphs: splitParagraphs(fm.content)
		});
		de.checked += 1;
		if (slug !== base) {
			fail('de', base, `slug im Frontmatter (${slug}) weicht vom Dateinamen ab`);
			continue;
		}
		const built = byKey.get(`${pageType}/${slug}`);
		if (!built) {
			fail('de', slug, 'kein passender Datensatz (orphan)');
			continue;
		}
		if (fm.data.inputHash !== built.inputHash) {
			stale('de', slug, 'inputHash veraltet, neu generieren');
		}
		const problem = describeLint(fm.content, built.input, 'de');
		if (problem) fail('de', slug, problem);
	}

	const enBases = new Set(enFiles.map((f) => f.name.replace(EN_SUFFIX, '')));
	for (const base of deByBase.keys()) {
		if (enBases.has(base)) continue;
		en.checked += 1;
		fail('en', base, 'fehlende .en.md zur DE-Datei');
	}

	for (const file of enFiles) {
		const base = file.name.replace(EN_SUFFIX, '');
		const fm = matter(file.raw);
		const slug = typeof fm.data.slug === 'string' ? fm.data.slug : base;
		const deInfo = deByBase.get(base);
		en.checked += 1;
		if (classifyEnProfile(fm.data, deInfo?.inputHash, deInfo !== undefined) === 'orphan') {
			fail('en', base, 'verwaiste .en.md ohne DE-Datei');
			continue;
		}
		if (slug !== base) {
			fail('en', base, `slug im Frontmatter (${slug}) weicht vom Dateinamen ab`);
			continue;
		}
		const enParagraphs = splitParagraphs(fm.content);
		if (enParagraphs.length === 0) {
			fail('en', slug, 'leerer EN-Body');
			continue;
		}
		if (classifyEnProfile(fm.data, deInfo?.inputHash, true) === 'stale') {
			stale('en', slug, 'sourceInputHash weicht vom DE-inputHash ab, neu übersetzen');
		}
		const textHash = hashProfileParagraphs(deInfo?.paragraphs ?? []);
		if (fm.data.sourceTextHash !== textHash) {
			stale('en', slug, 'sourceTextHash weicht vom DE-Text ab, neu übersetzen');
		}
		if (deInfo && enParagraphs.length !== deInfo.paragraphs.length) {
			fail('en', slug, `${enParagraphs.length} Absätze, DE hat ${deInfo.paragraphs.length}`);
		}
		const built = byKey.get(`${pageType}/${slug}`);
		if (!built) {
			fail('en', slug, 'kein passender Datensatz (orphan)');
			continue;
		}
		const problem = describeLint(fm.content, built.input, 'en');
		if (problem) fail('en', slug, problem);
	}

	return { de, en, messages };
}
