/**
 * Story 1.27 — Compare-Logic-Library. Pure-Function, deterministisch, kein Network.
 * Slug-Pattern-Dispatch via LAYER_COMPARE_PROFILE. Heuristiken bewusst konservativ:
 * - Editorial-Schutz: stolpersteine, bodenrichtwerte, milieuschutz NIE 'a-better'/'b-better'.
 * - Unknown-Slug-Default = categorical-neutral (equal bei gleich, sonst not-comparable).
 */

export type CompareDirection = 'a-better' | 'b-better' | 'equal' | 'not-comparable';

export interface CompareResult {
	direction: CompareDirection;
	deltaLabel?: string;
	advisory?: string;
}

export type CompareProfile =
	| 'numeric-lower-better'
	| 'numeric-no-judgment'
	| 'ordinal-higher-better'
	| 'ordinal-lower-better'
	| 'categorical-neutral'
	| 'presence-neutral-positive'
	| 'distance-lower-better'
	| 'count-no-judgment';

export const LAYER_COMPARE_PROFILE: Record<string, CompareProfile> = {
	// Boundaries
	bezirke: 'categorical-neutral',
	ortsteile: 'categorical-neutral',
	plz: 'categorical-neutral',

	// Wohn — Mietspiegel/Wohnlage NIE als „höher besser" werten (Editorial-Würde, niedrigere Stufe ≠ schlechter)
	bodenrichtwerte: 'numeric-no-judgment',
	'wohnlagen-2024': 'categorical-neutral',
	'mietspiegel-wohnlage': 'categorical-neutral',
	'milieuschutz-erhaltungsmiete': 'categorical-neutral',
	'milieuschutz-staedtebau': 'categorical-neutral',
	// Story 1.30: MSS-Gesamtindex — Editorial-neutral, kein Diff-Pfeil zwischen Status-Gruppen.
	'mss-gesamtindex-2025': 'categorical-neutral',

	// Umwelt — laerm-2023 ist kategorisch (gering/mittel/hoch), nur laerm-den/-night liefern echte dB
	'laerm-2023': 'ordinal-lower-better',
	'laerm-den': 'numeric-lower-better',
	'laerm-night': 'numeric-lower-better',
	'luft-2023': 'ordinal-lower-better',
	'bioklima-2023': 'ordinal-lower-better',
	'thermische-belastung-2023': 'ordinal-lower-better',
	'gruenversorgung-2023': 'ordinal-higher-better',
	'umweltgerechtigkeit-2023': 'ordinal-lower-better',

	// Klima
	'klima-pet-2022': 'numeric-lower-better',
	'klima-kaltlufteinwirkbereich-2022': 'presence-neutral-positive',
	'klima-leitbahnkorridor-2022': 'presence-neutral-positive',

	// Memorial
	stolpersteine: 'count-no-judgment',

	// Sozial
	'kitas-2024': 'distance-lower-better',
	'schulen-2024': 'distance-lower-better',
	'einschulbereiche-2024': 'categorical-neutral',
	'krankenhaeuser-plan': 'distance-lower-better',
	'krankenhaeuser-weitere': 'distance-lower-better',
	'sportanlagen-2024': 'distance-lower-better',
	spielplaetze: 'distance-lower-better',
	schwimmbaeder: 'distance-lower-better',
	gruenanlagen: 'presence-neutral-positive',
	trinkbrunnen: 'presence-neutral-positive',

	// Mobilität
	'ubahn-stationen': 'distance-lower-better',
	'sbahn-stationen': 'distance-lower-better',
	'tram-haltestellen': 'distance-lower-better',
	'bus-haltestellen': 'distance-lower-better',
	'radverkehrsnetz-2025': 'presence-neutral-positive',
	'fahrradstrassen-2024': 'presence-neutral-positive'
};

export function getCompareProfile(slug: string): CompareProfile {
	return LAYER_COMPARE_PROFILE[slug] ?? 'categorical-neutral';
}

const ORDINAL_RANKINGS: Record<string, readonly string[]> = {
	wohnlage: ['einfach', 'mittel', 'gut', 'sehr gut'],
	gruenversorgung: ['sehr gering', 'gering', 'mittel', 'hoch', 'sehr hoch'],
	belastung: ['gering', 'mittel', 'hoch', 'sehr hoch'],
	umweltgerechtigkeit: ['keine', 'einfach', 'zweifach', 'dreifach', 'vierfach']
};

const GRUENVERSORGUNG_RAW_MAP: Record<string, string> = {
	'sehr gut': 'sehr hoch',
	gut: 'hoch',
	mittel: 'mittel',
	schlecht: 'gering',
	'sehr schlecht': 'sehr gering'
};

const NUMERIC_UNITS: Record<string, string> = {
	'laerm-2023': 'dB',
	'laerm-den': 'dB',
	'laerm-night': 'dB',
	'klima-pet-2022': '°C'
};

const NUMERIC_KEYS: Record<string, readonly string[]> = {
	'klima-pet-2022': ['pet14h'],
	bodenrichtwerte: ['richtwert', 'eur_qm', 'wert']
};

const EQUALITY_TOLERANCE = 0.5;

function toFiniteNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Number(value);
		if (Number.isFinite(parsed) && value.trim() !== '') return parsed;
	}
	return null;
}

function extractNumber(slug: string, value: unknown): number | null {
	const direct = toFiniteNumber(value);
	if (direct !== null) return direct;
	if (!value || typeof value !== 'object') return null;
	const record = value as Record<string, unknown>;
	const keys = NUMERIC_KEYS[slug];
	if (keys) {
		for (const key of keys) {
			const n = toFiniteNumber(record[key]);
			if (n !== null) return n;
		}
	}
	for (const generic of ['value', 'wert', 'amount']) {
		const n = toFiniteNumber(record[generic]);
		if (n !== null) return n;
	}
	return null;
}

function extractKategorie(value: unknown): string | null {
	if (typeof value === 'string') return value.toLowerCase().trim();
	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		const k = record.kategorie ?? record.wol_mode ?? record.mode;
		if (typeof k === 'string') return k.toLowerCase().trim();
	}
	return null;
}

function extractDistanceM(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (!value || typeof value !== 'object') return null;
	const record = value as Record<string, unknown>;
	for (const key of ['distanceM', 'distance_m', 'distance']) {
		const n = toFiniteNumber(record[key]);
		if (n !== null) return n;
	}
	return null;
}

function extractCount(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (Array.isArray(value)) return value.length;
	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		const n = toFiniteNumber(record.count);
		if (n !== null) return n;
	}
	return null;
}

function isPresent(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	if (typeof value === 'object' && Object.keys(value as object).length === 0) return false;
	return true;
}

function formatDelta(n: number): string {
	if (Number.isInteger(n)) return n.toLocaleString('de-DE');
	return n.toLocaleString('de-DE', { maximumFractionDigits: 1 });
}

function compareNumeric(slug: string, a: number, b: number, lowerIsBetter: boolean): CompareResult {
	if (Math.abs(a - b) < EQUALITY_TOLERANCE) return { direction: 'equal' };
	const aBetter = lowerIsBetter ? a < b : a > b;
	const diff = Math.abs(a - b);
	const unit = NUMERIC_UNITS[slug] ?? '';
	const suffix = lowerIsBetter ? (aBetter ? 'weniger' : 'mehr') : aBetter ? 'mehr' : 'weniger';
	const unitPart = unit ? `${unit} ` : '';
	return {
		direction: aBetter ? 'a-better' : 'b-better',
		deltaLabel: `${formatDelta(diff)} ${unitPart}${suffix}`.trim()
	};
}

function compareNumericNoJudgment(slug: string, a: number, b: number): CompareResult {
	if (Math.abs(a - b) < EQUALITY_TOLERANCE) return { direction: 'equal' };
	const diff = Math.abs(a - b);
	const unit = slug === 'bodenrichtwerte' ? '€/m²' : (NUMERIC_UNITS[slug] ?? '');
	const higherSide = a > b ? 'A' : 'B';
	const advisory =
		slug === 'bodenrichtwerte'
			? 'Höherer Bodenrichtwert kann teurere Miete bedeuten, oft aber auch bessere Versorgung. Wir zeigen die Differenz, ohne Bewertung.'
			: 'Kontextuelle Werte, keine Wertung.';
	return {
		direction: 'not-comparable',
		deltaLabel: `${formatDelta(diff)} ${unit} höher in ${higherSide}`.trim(),
		advisory
	};
}

function rankFor(slug: string, value: string): { rank: number; ranking: readonly string[] } | null {
	let ranking: readonly string[] | null = null;
	if (slug === 'wohnlagen-2024' || slug === 'mietspiegel-wohnlage') {
		ranking = ORDINAL_RANKINGS.wohnlage ?? null;
	} else if (slug === 'gruenversorgung-2023') {
		const harmonized = GRUENVERSORGUNG_RAW_MAP[value] ?? value;
		ranking = ORDINAL_RANKINGS.gruenversorgung ?? null;
		if (ranking) {
			const rank = ranking.indexOf(harmonized);
			return rank >= 0 ? { rank, ranking } : null;
		}
	} else if (slug === 'umweltgerechtigkeit-2023') {
		ranking = ORDINAL_RANKINGS.umweltgerechtigkeit ?? null;
	} else {
		ranking = ORDINAL_RANKINGS.belastung ?? null;
	}
	if (!ranking) return null;
	const rank = ranking.indexOf(value);
	return rank >= 0 ? { rank, ranking } : null;
}

function compareOrdinal(
	slug: string,
	a: string,
	b: string,
	higherIsBetter: boolean
): CompareResult {
	const ra = rankFor(slug, a);
	const rb = rankFor(slug, b);
	if (!ra || !rb) return { direction: 'not-comparable' };
	if (ra.rank === rb.rank) return { direction: 'equal' };
	const aBetter = higherIsBetter ? ra.rank > rb.rank : ra.rank < rb.rank;
	return { direction: aBetter ? 'a-better' : 'b-better' };
}

function extractCategoricalKey(slug: string, value: unknown): string | null {
	if (typeof value === 'string') return value.toLowerCase().trim();
	if (!value || typeof value !== 'object') return null;
	const record = value as Record<string, unknown>;
	// Story 1.30: MSS-Gruppe = Status + Dynamik (plr_name ist Kontext, kein Schlüssel).
	if (slug === 'mss-gesamtindex-2025') {
		const si = typeof record.si_v === 'string' ? record.si_v : null;
		const di = typeof record.di_v === 'string' ? record.di_v : null;
		if (si && di) return `${si}/${di}`.toLowerCase();
		return null;
	}
	const k = record.kategorie ?? record.wol_mode ?? record.mode;
	if (typeof k === 'string') return k.toLowerCase().trim();
	return null;
}

function compareCategorical(slug: string, a: unknown, b: unknown): CompareResult {
	const aPresent = isPresent(a);
	const bPresent = isPresent(b);
	if (slug === 'milieuschutz-erhaltungsmiete' || slug === 'milieuschutz-staedtebau') {
		if (aPresent === bPresent) return { direction: aPresent ? 'equal' : 'equal' };
		return {
			direction: 'not-comparable',
			advisory:
				'Milieuschutz wirkt ambivalent: Schutz für Bewohner, kann aber Umzugschancen mindern.'
		};
	}
	const aKey =
		extractCategoricalKey(slug, a) ?? (a !== null && a !== undefined ? JSON.stringify(a) : null);
	const bKey =
		extractCategoricalKey(slug, b) ?? (b !== null && b !== undefined ? JSON.stringify(b) : null);
	if (!aPresent && !bPresent) return { direction: 'equal' };
	if (aKey !== null && bKey !== null && aKey === bKey) return { direction: 'equal' };
	return { direction: 'not-comparable' };
}

function comparePresence(a: unknown, b: unknown): CompareResult {
	const aP = isPresent(a);
	const bP = isPresent(b);
	if (aP === bP) return { direction: 'equal' };
	return { direction: aP ? 'a-better' : 'b-better' };
}

function compareDistance(a: number | null, b: number | null): CompareResult {
	if (a === null || b === null) return { direction: 'not-comparable' };
	if (Math.abs(a - b) < EQUALITY_TOLERANCE) return { direction: 'equal' };
	const aBetter = a < b;
	const diff = Math.abs(a - b);
	return {
		direction: aBetter ? 'a-better' : 'b-better',
		deltaLabel: `${formatDelta(diff)} m näher`
	};
}

function compareCount(a: unknown, b: unknown): CompareResult {
	const ca = extractCount(a);
	const cb = extractCount(b);
	const advisory =
		'Erinnerungs-Layer, kein Wohn-Score. Würde der Opfer steht über Vergleichbarkeit.';
	if (ca === null && cb === null) return { direction: 'not-comparable', advisory };
	return {
		direction: 'not-comparable',
		deltaLabel: `${ca ?? 0} vs ${cb ?? 0} im 200m-Radius`,
		advisory
	};
}

export function compareLayerValues(slug: string, valueA: unknown, valueB: unknown): CompareResult {
	const profile = getCompareProfile(slug);

	switch (profile) {
		case 'numeric-lower-better': {
			const a = extractNumber(slug, valueA);
			const b = extractNumber(slug, valueB);
			if (a === null || b === null) return { direction: 'not-comparable' };
			return compareNumeric(slug, a, b, true);
		}
		case 'numeric-no-judgment': {
			const a = extractNumber(slug, valueA);
			const b = extractNumber(slug, valueB);
			if (a === null || b === null) return { direction: 'not-comparable' };
			return compareNumericNoJudgment(slug, a, b);
		}
		case 'ordinal-higher-better': {
			const a = extractKategorie(valueA);
			const b = extractKategorie(valueB);
			if (!a || !b) return { direction: 'not-comparable' };
			return compareOrdinal(slug, a, b, true);
		}
		case 'ordinal-lower-better': {
			const a = extractKategorie(valueA);
			const b = extractKategorie(valueB);
			if (!a || !b) return { direction: 'not-comparable' };
			return compareOrdinal(slug, a, b, false);
		}
		case 'categorical-neutral':
			return compareCategorical(slug, valueA, valueB);
		case 'presence-neutral-positive':
			return comparePresence(valueA, valueB);
		case 'distance-lower-better':
			return compareDistance(extractDistanceM(valueA), extractDistanceM(valueB));
		case 'count-no-judgment':
			return compareCount(valueA, valueB);
	}
}
