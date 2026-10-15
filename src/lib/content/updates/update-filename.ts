/**
 * Dateinamen-Muster für `_content/updates/`. Abhängigkeitsfrei, damit Loader
 * (Server) und Übersetzungsregister (Client) dieselbe Regel nutzen.
 */

/** EN-Schwester `YYYY-MM-DD-<slug>.en.md`. */
const EN_SISTER = /^(\d{4}-\d{2}-\d{2}-.+)\.en\.md$/;

/** Anderer Locale-Suffix `YYYY-MM-DD-<slug>.<xx>.md` mit `xx` != `en`: nicht unterstützt. */
const OTHER_LOCALE = /^\d{4}-\d{2}-\d{2}-.+\.(?!en\.md$)[a-z]{2}\.md$/;

/** DE-Eintrag `YYYY-MM-DD-<slug>.md`. */
const DE_ENTRY = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;

export type UpdateFilename =
	| { kind: 'de'; key: string; date: string; slug: string }
	| { kind: 'en'; key: string }
	| { kind: 'other-locale' }
	| { kind: 'ignored' };

/** Letztes Pfadsegment. */
export function filenameOf(path: string): string {
	return path.split('/').pop() ?? path;
}

/**
 * Klassifiziert einen Dateinamen. `key` ist `YYYY-MM-DD-<slug>` und verbindet
 * DE-Eintrag und EN-Schwester.
 */
export function classifyUpdateFilename(filename: string): UpdateFilename {
	const en = EN_SISTER.exec(filename);
	if (en) return { kind: 'en', key: en[1] ?? '' };
	if (OTHER_LOCALE.test(filename)) return { kind: 'other-locale' };
	const de = DE_ENTRY.exec(filename);
	if (de) {
		const date = de[1] ?? '';
		const slug = de[2] ?? '';
		return { kind: 'de', key: `${date}-${slug}`, date, slug };
	}
	return { kind: 'ignored' };
}
