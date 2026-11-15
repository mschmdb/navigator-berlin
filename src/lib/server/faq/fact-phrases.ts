import type { TemplateLocale } from './template-schema.js';

/**
 * NAV-108: Satzbausteine für die Kiez- und Bezirks-FAQ. Reine Funktionen:
 * Die Fakten kommen aus dem Aggregat, die Wörter stehen hier. Klassen- und
 * Verteilungssätze für Grün und Lärm liegen in `share-phrases.ts`.
 */

export type Region = 'kiez' | 'bezirk';

const NUMBER_LOCALE: Record<TemplateLocale, string> = { de: 'de-DE', en: 'en-GB' };

function joinList(items: readonly string[], and: string): string {
	if (items.length <= 1) return items.join('');
	return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

function cap(s: string): string {
	return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/** „der Kiez“, „im Bezirk“, „the Kiez“: Ortsbezug, ohne den Namen zu wiederholen. */
export const REGION_WORDS: Record<
	TemplateLocale,
	Record<Region, { der: string; im: string; many: string; manyDat: string }>
> = {
	de: {
		kiez: { der: 'der Kiez', im: 'im Kiez', many: 'Kieze', manyDat: 'Kiezen' },
		bezirk: { der: 'der Bezirk', im: 'im Bezirk', many: 'Bezirke', manyDat: 'Bezirken' }
	},
	en: {
		kiez: { der: 'the Kiez', im: 'in the Kiez', many: 'Kieze', manyDat: 'Kieze' },
		bezirk: { der: 'the district', im: 'in the district', many: 'districts', manyDat: 'districts' }
	}
};

// ---------------------------------------------------------------- ÖPNV

export interface OepnvCounts {
	readonly uBahnCount: number | null;
	readonly sBahnCount: number | null;
	readonly tramCount: number | null;
	readonly busCount: number | null;
}

interface ModeWords {
	readonly one: string;
	readonly many: string;
	readonly none: string;
}

const MODE_WORDS: Record<TemplateLocale, Record<keyof OepnvCounts, ModeWords>> = {
	de: {
		uBahnCount: { one: 'U-Bahnhof', many: 'U-Bahnhöfe', none: 'kein U-Bahnhof' },
		sBahnCount: { one: 'S-Bahnhof', many: 'S-Bahnhöfe', none: 'kein S-Bahnhof' },
		tramCount: { one: 'Tramhaltestelle', many: 'Tramhaltestellen', none: 'keine Tramhaltestelle' },
		busCount: { one: 'Bushaltestelle', many: 'Bushaltestellen', none: 'keine Bushaltestelle' }
	},
	en: {
		uBahnCount: { one: 'U-Bahn station', many: 'U-Bahn stations', none: 'no U-Bahn station' },
		sBahnCount: { one: 'S-Bahn station', many: 'S-Bahn stations', none: 'no S-Bahn station' },
		tramCount: { one: 'tram stop', many: 'tram stops', none: 'no tram stop' },
		busCount: { one: 'bus stop', many: 'bus stops', none: 'no bus stop' }
	}
};

/** Einzahl mit Zahlwort statt „1“: „ein U-Bahnhof“, „eine Tramhaltestelle“. */
const ONE_ARTICLE: Record<TemplateLocale, Record<keyof OepnvCounts, string>> = {
	de: { uBahnCount: 'ein', sBahnCount: 'ein', tramCount: 'eine', busCount: 'eine' },
	en: { uBahnCount: 'one', sBahnCount: 'one', tramCount: 'one', busCount: 'one' }
};

const MODE_ORDER: readonly (keyof OepnvCounts)[] = [
	'uBahnCount',
	'sBahnCount',
	'tramCount',
	'busCount'
];

/**
 * „Im Kiez liegen 2 U-Bahnhöfe und 32 Bushaltestellen, aber kein S-Bahnhof und
 * keine Tramhaltestelle.“ Verneint nur bekannte Nullen; ohne Zähldaten leer.
 */
export function oepnvModiSatz(counts: OepnvCounts, region: Region, locale: TemplateLocale): string {
	const known = MODE_ORDER.filter((key) => counts[key] !== null);
	if (known.length === 0) return '';
	const words = MODE_WORDS[locale];
	const place = REGION_WORDS[locale][region];
	const present = known.filter((key) => (counts[key] ?? 0) > 0);
	const missing = known.filter((key) => counts[key] === 0).map((key) => words[key].none);
	const and = locale === 'de' ? 'und' : 'and';
	if (present.length === 0) {
		const list =
			known.length === MODE_ORDER.length
				? locale === 'de'
					? 'keine Haltestelle'
					: 'no stops'
				: joinList(missing, and);
		return locale === 'de' ? `${cap(place.im)} liegt ${list}.` : `${cap(place.der)} has ${list}.`;
	}
	const items = present.map((key) => {
		const n = counts[key] ?? 0;
		if (n === 1) return `${ONE_ARTICLE[locale][key]} ${words[key].one}`;
		return `${n.toLocaleString(NUMBER_LOCALE[locale])} ${words[key].many}`;
	});
	const but =
		missing.length > 0 ? `, ${locale === 'de' ? 'aber' : 'but'} ${joinList(missing, and)}` : '';
	if (locale === 'de') {
		const plural = present.length > 1 || (counts[present[0]] ?? 0) > 1;
		return `${cap(place.im)} ${plural ? 'liegen' : 'liegt'} ${joinList(items, and)}${but}.`;
	}
	return `${cap(place.der)} has ${joinList(items, and)}${but}.`;
}

export type OepnvDichteKlasse = 'sehr dicht' | 'dicht' | 'mittel' | 'dünn';

export function oepnvDichteKlasse(stopsPerKm2: number): OepnvDichteKlasse {
	if (stopsPerKm2 >= 20) return 'sehr dicht';
	if (stopsPerKm2 >= 12) return 'dicht';
	if (stopsPerKm2 >= 6) return 'mittel';
	return 'dünn';
}

/** Urteil zur Haltestellendichte; die Faktenprüfung liest dieselbe Tabelle. */
export const OEPNV_URTEIL: Record<TemplateLocale, Record<OepnvDichteKlasse, string>> = {
	de: {
		'sehr dicht':
			'Das Haltestellennetz ist hier sehr dicht, so dicht wie in innerstädtischen Lagen.',
		dicht: 'Das Haltestellennetz ist hier dicht, typisch für gemischte Innenstadtlagen.',
		mittel: 'Das Haltestellennetz ist hier mittel dicht, im Berliner Mittelfeld.',
		dünn: 'Das Haltestellennetz ist hier dünn. Bis zur nächsten Haltestelle kann der Weg länger sein.'
	},
	en: {
		'sehr dicht': 'The stop network here is very dense, as dense as in inner-city areas.',
		dicht: 'The stop network here is dense, typical of mixed inner-city areas.',
		mittel: 'The stop network here is moderately dense, in the Berlin mid-range.',
		dünn: 'The stop network here is sparse. The walk to the next stop can be longer.'
	}
};

export function oepnvUrteil(stopsPerKm2: number, locale: TemplateLocale): string {
	return OEPNV_URTEIL[locale][oepnvDichteKlasse(stopsPerKm2)];
}

// ---------------------------------------------------------------- Klima

export type PetKlasse = 'entspannt' | 'gemaessigt' | 'belastet' | 'stark';

export function petKlasse(pet: number): PetKlasse {
	if (pet < 35) return 'entspannt';
	if (pet < 41) return 'gemaessigt';
	if (pet < 46) return 'belastet';
	return 'stark';
}

/** Kennwort je PET-Klasse; die Faktenprüfung sucht genau dieses Wort. */
export const KLIMA_KENNWORT: Record<TemplateLocale, Record<PetKlasse, string>> = {
	de: {
		entspannt: 'vergleichsweise erträglich',
		gemaessigt: 'warm, aber nicht extrem',
		belastet: 'wird es hier heiß',
		stark: 'wird es hier sehr heiß'
	},
	en: {
		entspannt: 'comparatively bearable',
		gemaessigt: 'warm here, but not extreme',
		belastet: 'gets hot here',
		stark: 'gets very hot here'
	}
};

const KLIMA_SATZ: Record<TemplateLocale, Record<PetKlasse, (pet: string) => string>> = {
	de: {
		entspannt: (p) =>
			`An heißen Tagen bleibt es hier vergleichsweise erträglich: Die gefühlte Temperatur liegt im Schnitt bei ${p} Grad.`,
		gemaessigt: (p) =>
			`An heißen Tagen wird es hier warm, aber nicht extrem: Die gefühlte Temperatur liegt im Schnitt bei ${p} Grad.`,
		belastet: (p) =>
			`An heißen Tagen wird es hier heiß: Die gefühlte Temperatur liegt im Schnitt bei ${p} Grad. Schatten und Trinkwasser werden dann wichtig.`,
		stark: (p) =>
			`An heißen Tagen wird es hier sehr heiß: Die gefühlte Temperatur liegt im Schnitt bei ${p} Grad. Für Ältere, Kinder und Kranke kann das gefährlich werden.`
	},
	en: {
		entspannt: (p) =>
			`On hot days it stays comparatively bearable here: the perceived temperature averages ${p} degrees.`,
		gemaessigt: (p) =>
			`On hot days it gets warm here, but not extreme: the perceived temperature averages ${p} degrees.`,
		belastet: (p) =>
			`On hot days it gets hot here: the perceived temperature averages ${p} degrees. Shade and drinking water matter then.`,
		stark: (p) =>
			`On hot days it gets very hot here: the perceived temperature averages ${p} degrees. For older people, children and the sick this can be dangerous.`
	}
};

export function klimaSatz(pet: number, locale: TemplateLocale): string {
	const formatted = pet.toLocaleString(NUMBER_LOCALE[locale], {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
	return KLIMA_SATZ[locale][petKlasse(pet)](formatted);
}

// ---------------------------------------------------------------- Rang + Vergleich

export interface RankInput {
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
	/** Wie viele andere Gebiete denselben Wettkampf-Rang haben. */
	readonly geteiltMit?: number;
}

/**
 * „Platz 55 von 143 Kiezen“, „geteilter Platz 7 von 143 Kiezen“ oder im
 * schwächsten Viertel (Anti-Stigma, ADR-015) „im unteren Viertel der 143 Kieze“.
 */
export function rangLage(m: RankInput, region: Region, locale: TemplateLocale): string | null {
	if (m.rang === null || m.total <= 0) return null;
	const w = REGION_WORDS[locale][region];
	if (m.quartil === 4) {
		return locale === 'de'
			? `im unteren Viertel der ${m.total} ${w.many}`
			: `in the bottom quarter of the ${m.total} ${w.many}`;
	}
	const shared = (m.geteiltMit ?? 0) > 0;
	if (locale === 'de')
		return `${shared ? 'geteilter ' : ''}Platz ${m.rang} von ${m.total} ${w.manyDat}`;
	return `${shared ? 'joint ' : ''}rank ${m.rang} of ${m.total} ${w.many}`;
}

export type CompareKind = 'bezirk' | 'berlin';

export const VERGLEICH: Record<
	TemplateLocale,
	Record<CompareKind, { above: string; below: string; same: string }>
> = {
	de: {
		bezirk: {
			above: 'mehr als im Schnitt der Kieze im Bezirk',
			below: 'weniger als im Schnitt der Kieze im Bezirk',
			same: 'etwa so viel wie im Schnitt der Kieze im Bezirk'
		},
		berlin: {
			above: 'mehr als beim mittleren Berliner Bezirk',
			below: 'weniger als beim mittleren Berliner Bezirk',
			same: 'etwa so viel wie beim mittleren Berliner Bezirk'
		}
	},
	en: {
		bezirk: {
			above: 'more than the average of the Kieze in its district',
			below: 'less than the average of the Kieze in its district',
			same: 'about the same as the average of the Kieze in its district'
		},
		berlin: {
			above: 'more than the median Berlin district',
			below: 'less than the median Berlin district',
			same: 'about the same as the median Berlin district'
		}
	}
};

/** Abstand unter einem Punkt gilt als „etwa so viel“. */
export function vergleich(
	value: number | null,
	compareValue: number | null,
	kind: CompareKind,
	locale: TemplateLocale
): string | null {
	if (value === null || compareValue === null) return null;
	const delta = value - compareValue;
	const v = VERGLEICH[locale][kind];
	return Math.abs(delta) < 1 ? v.same : delta > 0 ? v.above : v.below;
}
