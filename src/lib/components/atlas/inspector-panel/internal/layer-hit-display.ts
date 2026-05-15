// Story 1.18: Strukturierte Display-Daten pro Layer-Hit für ValueChip + Subline-Pattern.
// Trennt "Wert" (Chip) von "Kontext" (Kiez/PLR/Adresse) und liefert Fallback-Text für POIs
// und Editorial-Layer ohne semantische Severity.

import { mapGruenversorgungKategorie } from './gruenversorgung-kategorie.js';

export interface ChipData {
	value: string;
	unit?: string;
	numeric: boolean;
}

export interface LayerHitDisplay {
	chip: ChipData | null;
	fallbackText: string | null;
	context: string | null;
}

const EMPTY: LayerHitDisplay = { chip: null, fallbackText: null, context: null };

function pickProp(value: unknown, key: string): unknown {
	if (value && typeof value === 'object' && key in value) {
		return (value as Record<string, unknown>)[key];
	}
	return undefined;
}

function firstString(value: unknown, ...keys: string[]): string | undefined {
	for (const k of keys) {
		const v = pickProp(value, k);
		if (typeof v === 'string' && v.length > 0) return v;
		if (typeof v === 'number') return String(v);
	}
	return undefined;
}

function chipOnly(value: string, numeric = false, unit?: string): LayerHitDisplay {
	return { chip: { value, numeric, unit }, fallbackText: null, context: null };
}

function chipWithContext(
	value: string,
	context: string | null,
	numeric = false,
	unit?: string
): LayerHitDisplay {
	return { chip: { value, numeric, unit }, fallbackText: null, context };
}

function fallback(text: string, context: string | null = null): LayerHitDisplay {
	return { chip: null, fallbackText: text, context };
}

function umweltatlasDisplay(
	value: unknown,
	mapKategorie?: (raw: string) => string
): LayerHitDisplay {
	const kategorie = pickProp(value, 'kategorie');
	const plr = pickProp(value, 'plr_name');
	if (typeof kategorie !== 'string') return EMPTY;
	const display = mapKategorie ? mapKategorie(kategorie) : kategorie;
	return chipWithContext(display, typeof plr === 'string' ? plr : null);
}

function laermNumericDisplay(value: unknown): LayerHitDisplay {
	if (typeof value === 'number') return chipOnly(String(value), true, 'dB');
	if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
		return chipOnly(value, true, 'dB');
	}
	return umweltatlasDisplay(value);
}

function brwDisplay(value: unknown): LayerHitDisplay {
	const numFmt = new Intl.NumberFormat('de-DE');
	if (typeof value === 'number') return chipOnly(numFmt.format(value), true, '€/m²');
	const brw = pickProp(value, 'brw');
	const nutzung = pickProp(value, 'nutzung');
	if (typeof brw !== 'number') return EMPTY;
	return chipWithContext(
		numFmt.format(brw),
		typeof nutzung === 'string' ? nutzung : null,
		true,
		'€/m²'
	);
}

function klimaPetDisplay(value: unknown): LayerHitDisplay {
	const pet = pickProp(value, 'pet14h');
	if (typeof pet !== 'number') return EMPTY;
	const numFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
	return chipOnly(numFmt.format(pet), true, '°C');
}

function wohnlageDisplay(value: unknown): LayerHitDisplay {
	if (typeof value === 'string') return chipOnly(value);
	const mode = pickProp(value, 'wol_mode');
	if (typeof mode !== 'string' || mode === 'unbekannt') return EMPTY;
	const plr = pickProp(value, 'plr_name');
	return chipWithContext(mode, typeof plr === 'string' ? plr : null);
}

function umweltgerechtigkeitDisplay(value: unknown): LayerHitDisplay {
	const kategorie = pickProp(value, 'kategorie');
	if (typeof kategorie !== 'string') return EMPTY;
	const sub: string[] = [];
	for (const [k, label] of [
		['laerm', 'Lärm'],
		['luft', 'Luft'],
		['bioklima', 'Bioklima'],
		['gruenvers', 'Grün']
	] as const) {
		const v = pickProp(value, k);
		if (typeof v === 'string') sub.push(`${label}: ${v}`);
	}
	// Story 1.18 User-Feedback: kategorie "zweifach" allein liest unverständlich.
	// Mehrfachbelastung wird als Zähler ausgeschrieben.
	const UMWELTGERECHTIGKEIT_LABELS: Record<string, string> = {
		keine: 'keine Belastung',
		einfach: '1× belastet',
		zweifach: '2× belastet',
		dreifach: '3× belastet'
	};
	const key = kategorie.toLowerCase().trim();
	const chipText = UMWELTGERECHTIGKEIT_LABELS[key] ?? kategorie;
	return chipWithContext(chipText, sub.length > 0 ? sub.join(', ') : null);
}

function poiKita(value: unknown): LayerHitDisplay {
	const name = firstString(value, 'e_name');
	if (!name) return EMPTY;
	const strasse = firstString(value, 'e_strasse');
	const hnr = firstString(value, 'e_hnr');
	const addr = strasse && hnr ? `${strasse} ${hnr}` : (strasse ?? null);
	return fallback(name, addr);
}

function poiSchule(value: unknown): LayerHitDisplay {
	const name = firstString(value, 'schulname');
	if (!name) return EMPTY;
	const art = firstString(value, 'schulart');
	return fallback(name, art ?? null);
}

function poiKrankenhaus(value: unknown): LayerHitDisplay {
	const name = firstString(value, 'kkh', 'name');
	if (!name) return EMPTY;
	const strasse = firstString(value, 'gc_strasse');
	const betten = pickProp(value, 'betten');
	const ctxParts: string[] = [];
	if (strasse) ctxParts.push(strasse);
	if (typeof betten === 'number') ctxParts.push(`${betten} Betten`);
	return fallback(name, ctxParts.length > 0 ? ctxParts.join(' · ') : null);
}

function poiSportanlage(value: unknown): LayerHitDisplay {
	const name = firstString(value, 'name');
	if (!name) return EMPTY;
	const flaeche = pickProp(value, 'gesamtflaeche_standort_qm');
	const ctx =
		typeof flaeche === 'number'
			? `${new Intl.NumberFormat('de-DE').format(flaeche)} m²`
			: null;
	return fallback(name, ctx);
}

function poiSchwimmbad(value: unknown): LayerHitDisplay {
	const name = firstString(value, 'name_des_schwimmbads');
	if (!name) return EMPTY;
	const kat = firstString(value, 'badkategorie');
	return fallback(name, kat ?? null);
}

function poiEinschulbereich(value: unknown): LayerHitDisplay {
	const esb = firstString(value, 'esb');
	if (!esb) return EMPTY;
	const bez = firstString(value, 'bezname');
	return fallback(`ESB ${esb}`, bez ?? null);
}

function poiGruenflaeche(value: unknown): LayerHitDisplay {
	const name = firstString(value, 'namenr', 'kennzeich');
	const objart = firstString(value, 'objartname');
	const label = name ?? objart;
	if (!label) return EMPTY;
	const bezirk = firstString(value, 'bezirkname');
	return fallback(label, bezirk ?? null);
}

function poiMilieuschutz(value: unknown): LayerHitDisplay {
	const name = firstString(value, 'gebietsname');
	if (!name) return EMPTY;
	const bezirk = firstString(value, 'bezirk');
	return fallback(name, bezirk ?? null);
}

function poiFahrradstrasse(value: unknown): LayerHitDisplay {
	const strasse = firstString(value, 'strasse');
	if (!strasse) return EMPTY;
	const bezirk = firstString(value, 'bezirk');
	return fallback(strasse, bezirk ?? null);
}

function poiOepnv(value: unknown, prefix: string): LayerHitDisplay {
	const name = firstString(value, 'name');
	return fallback(prefix, name ?? null);
}

function poiStolperstein(value: unknown): LayerHitDisplay {
	const person = firstString(value, 'person', 'name', 'vorname_nachname');
	if (person) return fallback(`Für ${person}`, null);
	return fallback('Gedenkstein in der Nähe', null);
}

function poiTrinkbrunnen(value: unknown): LayerHitDisplay {
	const name = firstString(value, 'name');
	return chipWithContext('Trinkbrunnen vor Ort', name ?? null);
}

function boundaryBezirk(value: unknown): LayerHitDisplay {
	if (typeof value === 'string') return chipOnly(value);
	const name = firstString(value, 'Gemeinde_name');
	if (name) return chipOnly(name);
	return EMPTY;
}

function boundaryOrtsteil(value: unknown): LayerHitDisplay {
	if (typeof value === 'string') return chipOnly(value);
	const name = firstString(value, 'OTEIL', 'spatial_alias');
	const bezirk = firstString(value, 'BEZIRK');
	if (!name) return EMPTY;
	const ctx = bezirk && bezirk !== name ? bezirk : null;
	return chipWithContext(name, ctx);
}

function boundaryPlz(value: unknown): LayerHitDisplay {
	if (typeof value === 'string') return chipOnly(value);
	const plz = firstString(value, 'plz');
	return plz ? chipOnly(plz) : EMPTY;
}

function strassenlaermDisplay(value: unknown): LayerHitDisplay {
	const gruppe = pickProp(value, 'gruppe_txt');
	if (typeof gruppe !== 'string') return EMPTY;
	return chipWithContext(gruppe, 'Schienenverkehr');
}

function mssGesamtindexDisplay(value: unknown): LayerHitDisplay {
	const si = firstString(value, 'si_v');
	const di = firstString(value, 'di_v');
	const plr = firstString(value, 'plr_name');
	const kom = firstString(value, 'kom');
	const context = plr ?? null;
	if (kom && kom !== 'gültig') {
		return { chip: null, fallbackText: 'Aggregat nicht aussagekräftig', context };
	}
	if (!si || !di) return EMPTY;
	return chipWithContext(`${si}, ${di}`, context);
}

function klimaHighlight(value: unknown, label: string): LayerHitDisplay {
	if (!value || (typeof value === 'object' && Object.keys(value as object).length === 0)) {
		return EMPTY;
	}
	return chipOnly(label);
}

export function getLayerHitDisplay(slug: string, value: unknown): LayerHitDisplay {
	if (value === null || value === undefined) return EMPTY;
	if (typeof value === 'object' && Object.keys(value as object).length === 0) return EMPTY;

	switch (slug) {
		case 'bezirke':
			return boundaryBezirk(value);
		case 'ortsteile':
			return boundaryOrtsteil(value);
		case 'plz':
			return boundaryPlz(value);
		case 'bodenrichtwerte':
			return brwDisplay(value);
		case 'strassenlaerm-2022':
			return strassenlaermDisplay(value);
		case 'laerm-2023':
			return laermNumericDisplay(value);
		case 'laerm-den':
		case 'laerm-night':
			return laermNumericDisplay(value);
		case 'luft-2023':
		case 'bioklima-2023':
		case 'thermische-belastung-2023':
			return umweltatlasDisplay(value);
		case 'gruenversorgung-2023':
			return umweltatlasDisplay(value, mapGruenversorgungKategorie);
		case 'umweltgerechtigkeit-2023':
			return umweltgerechtigkeitDisplay(value);
		case 'klima-pet-2022':
			return klimaPetDisplay(value);
		case 'klima-kaltlufteinwirkbereich-2022':
			return klimaHighlight(value, 'Kaltluft-Einwirkbereich');
		case 'klima-leitbahnkorridor-2022':
			return klimaHighlight(value, 'Kaltluft-Leitbahn-Korridor');
		case 'mietspiegel-wohnlage':
		case 'wohnlagen-2024':
			return wohnlageDisplay(value);
		case 'milieuschutz-erhaltungsmiete':
		case 'milieuschutz-staedtebau':
			return poiMilieuschutz(value);
		case 'mss-gesamtindex-2025':
			return mssGesamtindexDisplay(value);
		case 'kitas-2024':
			return poiKita(value);
		case 'schulen-2024':
			return poiSchule(value);
		case 'einschulbereiche-2024':
			return poiEinschulbereich(value);
		case 'krankenhaeuser-plan':
		case 'krankenhaeuser-weitere':
			return poiKrankenhaus(value);
		case 'sportanlagen-2024':
			return poiSportanlage(value);
		case 'gruenanlagen':
		case 'spielplaetze':
			return poiGruenflaeche(value);
		case 'schwimmbaeder':
			return poiSchwimmbad(value);
		case 'radverkehrsnetz-2025': {
			const netz = firstString(value, 'ist_radvorrangnetz');
			return netz ? chipOnly(netz) : EMPTY;
		}
		case 'fahrradstrassen-2024':
			return poiFahrradstrasse(value);
		case 'ubahn-stationen':
			return poiOepnv(value, 'U-Bahn');
		case 'sbahn-stationen':
			return poiOepnv(value, 'S-Bahn');
		case 'tram-haltestellen':
			return poiOepnv(value, 'Tram');
		case 'bus-haltestellen':
			return poiOepnv(value, 'Bus');
		case 'ubahn-netz':
			return chipOnly('U-Bahn-Trasse');
		case 'tram-netz':
			return chipOnly('Tram-Trasse');
		case 'sbahn-netz':
			return chipOnly('S-Bahn-Trasse');
		case 'stolpersteine':
			return poiStolperstein(value);
		case 'trinkbrunnen':
			return poiTrinkbrunnen(value);
		case 'solarpotenzial':
			return chipOnly(String(value), true, 'kWh/m²');
		case 'gebaeudealter':
			return chipOnly(String(value));
		default:
			if (typeof value === 'string' || typeof value === 'number') {
				return chipOnly(String(value), typeof value === 'number');
			}
			return EMPTY;
	}
}
