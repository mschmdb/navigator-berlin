import { open, readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { isStrictBuild } from '$lib/build/strict-build.js';
import { validLastmod, type ProfileDates } from '../lastmod.js';

/**
 * S5: liest die Inhaltsdaten für `lastmod` zur Build-Zeit aus den committeten
 * Dateien. Keine Versionshistorie (im Docker-Build nicht vorhanden), kein
 * `computed_at` aus der DB (wird bei jedem Prebuild neu gesetzt).
 *
 * Fehlerpolitik: einzelne kaputte Profile überspringt die Funktion mit Warnung.
 * Ein fehlendes Verzeichnis oder eine fehlende Scores-Datei wirft im strikten
 * Build (`NAVIGATOR_STRICT_BUILD=1`), sonst warnt sie.
 */

const SCORES_HEAD_BYTES = 2048;
const PROFILE_FILE = /^([a-z0-9-]+)(?:\.(en))?\.md$/;

function failOrWarn(message: string): void {
	if (isStrictBuild()) throw new Error(`[sitemap] ${message}`);
	console.warn(`[sitemap] ${message} lastmod entfällt für die betroffenen Seiten.`);
}

function toIso(value: unknown): string | undefined {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? undefined : validLastmod(value.toISOString());
	}
	return typeof value === 'string' ? validLastmod(value) : undefined;
}

/**
 * Frontmatter-Zeitstempel aller Profile eines Typs: `<slug>.md` liefert
 * `generatedAt`, `<slug>.en.md` liefert `translatedAt`. Slugs ohne gültiges
 * Datum fehlen im Ergebnis.
 */
export async function readProfileDates(
	pageType: 'kiez' | 'bezirk',
	contentRoot: string = resolve(process.cwd(), 'src/lib/content')
): Promise<Record<string, ProfileDates>> {
	const dir = resolve(contentRoot, `${pageType}-profile`);
	let files: string[];
	try {
		files = await readdir(dir);
	} catch {
		failOrWarn(`Profilverzeichnis ${pageType}-profile nicht lesbar.`);
		return {};
	}
	const result: Record<string, ProfileDates> = {};
	await Promise.all(
		files.map(async (file) => {
			const match = PROFILE_FILE.exec(file);
			if (!match) return;
			const [, slug, en] = match;
			try {
				const data = matter(await readFile(resolve(dir, file), 'utf-8')).data;
				const field = en ? 'translatedAt' : 'generatedAt';
				const date = toIso(data[field]);
				if (!date) {
					console.warn(`[sitemap] ${pageType}-profile/${file}: ${field} fehlt oder ist ungültig.`);
					return;
				}
				result[slug] = { ...result[slug], [field]: date };
			} catch {
				console.warn(`[sitemap] ${pageType}-profile/${file}: Frontmatter nicht lesbar.`);
			}
		})
	);
	return result;
}

/**
 * `generatedAt` von `kiez-scores.json`. Die Datei ist über 2 MB groß, das Feld
 * steht direkt am Anfang, deshalb liest die Funktion nur den Dateikopf.
 */
export async function readScoresGeneratedAt(
	path: string = resolve(process.cwd(), 'static/kiez-scores/kiez-scores.json')
): Promise<string | undefined> {
	let head: string;
	try {
		const handle = await open(path, 'r');
		try {
			const buffer = Buffer.alloc(SCORES_HEAD_BYTES);
			const { bytesRead } = await handle.read(buffer, 0, SCORES_HEAD_BYTES, 0);
			head = buffer.toString('utf-8', 0, bytesRead);
		} finally {
			await handle.close();
		}
	} catch {
		failOrWarn('kiez-scores.json nicht lesbar.');
		return undefined;
	}
	const date = validLastmod(/"generatedAt"\s*:\s*"([^"]+)"/.exec(head)?.[1]);
	if (!date) failOrWarn('kiez-scores.json enthält kein gültiges generatedAt.');
	return date;
}
