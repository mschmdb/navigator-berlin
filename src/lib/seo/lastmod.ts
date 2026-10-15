import type { Locale } from '$lib/paraglide/runtime';

/** Frontmatter-Zeitstempel eines KI-Profils (`generatedAt` DE, `translatedAt` EN). */
export interface ProfileDates {
	readonly generatedAt?: string;
	readonly translatedAt?: string;
}

const W3C_DATETIME =
	/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;

/**
 * Gibt den Wert zurück, wenn er ein W3C-Datum ist (`YYYY-MM-DD` oder ISO-Datetime
 * mit Zeitzone) und im Kalender existiert (2026-02-30 fällt durch), sonst `undefined`.
 */
export function validLastmod(value: string | null | undefined): string | undefined {
	if (!value) return undefined;
	const m = W3C_DATETIME.exec(value);
	if (!m) return undefined;
	const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const calendar = new Date(Date.UTC(year, month - 1, day));
	if (
		calendar.getUTCFullYear() !== year ||
		calendar.getUTCMonth() !== month - 1 ||
		calendar.getUTCDate() !== day
	) {
		return undefined;
	}
	if (m[4] !== undefined) {
		if (Number(m[4]) > 23 || Number(m[5]) > 59 || Number(m[6] ?? 0) > 59) return undefined;
		const offset = m[7] ?? 'Z';
		if (offset !== 'Z' && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4, 6)) > 59)) {
			return undefined;
		}
	}
	return value;
}

/** Spätestes gültiges Datum der Liste, `undefined` ohne gültigen Wert. */
export function latestLastmod(values: readonly (string | null | undefined)[]): string | undefined {
	let latest: string | undefined;
	for (const value of values) {
		const valid = validLastmod(value);
		if (valid && (latest === undefined || Date.parse(valid) > Date.parse(latest))) latest = valid;
	}
	return latest;
}

/**
 * `lastmod` einer Kiez-/Bezirksseite: späteres Datum aus Profil-Frontmatter
 * und Scores-Datensatz. Die EN-Seite berücksichtigt zusätzlich `translatedAt`.
 */
export function profileLastmod(
	dates: ProfileDates | undefined,
	locale: Locale,
	scoresGeneratedAt: string | undefined
): string | undefined {
	return latestLastmod([
		dates?.generatedAt,
		locale === 'en' ? dates?.translatedAt : undefined,
		scoresGeneratedAt
	]);
}
