// Story 1.18: Strukturierte Display-Daten pro Layer-Hit für ValueChip + Subline-Pattern.
// Trennt "Wert" (Chip) von "Kontext" (Kiez/PLR/Adresse) und liefert Fallback-Text für POIs
// und Editorial-Layer ohne semantische Severity.

import { mapGruenversorgungKategorie } from './gruenversorgung-kategorie.js';
import { m } from '$lib/paraglide/messages.js';
import { formatCount, formatDecimal } from '$lib/i18n/format.js';
import { toAtlasMessageOptions, type LocaleOptions } from '../../internal/atlas-label-options.js';
import { translateClosedCategory } from './value-formatters.js';

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
	opts?: LocaleOptions,
	mapKategorie?: (raw: string) => string
): LayerHitDisplay {
	const kategorie = pickProp(value, 'kategorie');
	const plr = pickProp(value, 'plr_name');
	if (typeof kategorie !== 'string') return EMPTY;
	// Koordinator-Entscheidung: geschlossene Kategorien-Menge übersetzen.
	const harmonized = mapKategorie ? mapKategorie(kategorie) : kategorie;
	const display = translateClosedCategory(harmonized, opts);
	return chipWithContext(display, typeof plr === 'string' ? plr : null);
}

function laermNumericDisplay(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	if (typeof value === 'number') return chipOnly(String(value), true, 'dB');
	if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
		return chipOnly(value, true, 'dB');
	}
	return umweltatlasDisplay(value, opts);
}

function brwDisplay(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	const options = toAtlasMessageOptions(opts);
	if (typeof value === 'number') return chipOnly(formatCount(value, options), true, '€/m²');
	const brw = pickProp(value, 'brw');
	const nutzung = pickProp(value, 'nutzung');
	if (typeof brw !== 'number') return EMPTY;
	return chipWithContext(
		formatCount(brw, options),
		typeof nutzung === 'string' ? nutzung : null,
		true,
		'€/m²'
	);
}

function klimaPetDisplay(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	const pet = pickProp(value, 'pet14h');
	if (typeof pet !== 'number') return EMPTY;
	const options = toAtlasMessageOptions(opts);
	return chipOnly(formatDecimal(pet, { ...options, maximumFractionDigits: 1 }), true, '°C');
}

function wohnlageDisplay(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	if (typeof value === 'string') return chipOnly(value);
	const mode = pickProp(value, 'wol_mode');
	if (typeof mode !== 'string' || mode === 'unbekannt') return EMPTY;
	const plr = pickProp(value, 'plr_name');
	// Koordinator-Entscheidung: geschlossene Kategorien-Menge übersetzen.
	return chipWithContext(translateClosedCategory(mode, opts), typeof plr === 'string' ? plr : null);
}

function umweltgerechtigkeitDisplay(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	const kategorie = pickProp(value, 'kategorie');
	if (typeof kategorie !== 'string') return EMPTY;
	const options = toAtlasMessageOptions(opts);
	const sub: string[] = [];
	const topicMap = [
		['laerm', m.atlas_value_topic_laerm(undefined, options)],
		['luft', m.atlas_value_topic_luft(undefined, options)],
		['bioklima', m.atlas_value_topic_bioklima(undefined, options)],
		['gruenvers', m.atlas_value_topic_gruen(undefined, options)]
	] as const;
	for (const [key, label] of topicMap) {
		const v = pickProp(value, key);
		if (typeof v === 'string') sub.push(`${label}: ${v}`);
	}
	// Story 1.18 User-Feedback: kategorie "zweifach" allein liest unverständlich.
	// Mehrfachbelastung wird als Zähler ausgeschrieben.
	const UMWELTGERECHTIGKEIT_LABELS: Record<string, string> = {
		keine: m.atlas_hit_umweltgerechtigkeit_keine(undefined, options),
		einfach: m.atlas_hit_umweltgerechtigkeit_einfach(undefined, options),
		zweifach: m.atlas_hit_umweltgerechtigkeit_zweifach(undefined, options),
		dreifach: m.atlas_hit_umweltgerechtigkeit_dreifach(undefined, options)
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

function poiKrankenhaus(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	const name = firstString(value, 'kkh', 'name');
	if (!name) return EMPTY;
	const options = toAtlasMessageOptions(opts);
	const strasse = firstString(value, 'gc_strasse');
	const betten = pickProp(value, 'betten');
	const ctxParts: string[] = [];
	if (strasse) ctxParts.push(strasse);
	if (typeof betten === 'number')
		ctxParts.push(`${formatCount(betten, options)} ${m.atlas_value_betten(undefined, options)}`);
	return fallback(name, ctxParts.length > 0 ? ctxParts.join(' · ') : null);
}

function poiSportanlage(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	const name = firstString(value, 'name');
	if (!name) return EMPTY;
	const flaeche = pickProp(value, 'gesamtflaeche_standort_qm');
	const ctx =
		typeof flaeche === 'number' ? `${formatCount(flaeche, toAtlasMessageOptions(opts))} m²` : null;
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

function poiStolperstein(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	const options = toAtlasMessageOptions(opts);
	const person = firstString(value, 'person', 'name', 'vorname_nachname');
	if (person) return fallback(m.atlas_value_stolperstein_fuer({ name: person }, options), null);
	return fallback(m.atlas_value_gedenkstein_in_der_naehe(undefined, options), null);
}

function poiTrinkbrunnen(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	const name = firstString(value, 'name');
	return chipWithContext(
		m.atlas_value_trinkbrunnen_vor_ort(undefined, toAtlasMessageOptions(opts)),
		name ?? null
	);
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

function strassenlaermDisplay(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	const gruppe = pickProp(value, 'gruppe_txt');
	if (typeof gruppe !== 'string') return EMPTY;
	return chipWithContext(
		gruppe,
		m.atlas_value_schienenverkehr(undefined, toAtlasMessageOptions(opts))
	);
}

function mssGesamtindexDisplay(value: unknown, opts?: LocaleOptions): LayerHitDisplay {
	const si = firstString(value, 'si_v');
	const di = firstString(value, 'di_v');
	const plr = firstString(value, 'plr_name');
	const kom = firstString(value, 'kom');
	const context = plr ?? null;
	if (kom && kom !== 'gültig') {
		const options = toAtlasMessageOptions(opts);
		return {
			chip: null,
			fallbackText: m.atlas_value_aggregat_nicht_aussagekraeftig(undefined, options),
			context
		};
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

export function getLayerHitDisplay(
	slug: string,
	value: unknown,
	opts?: LocaleOptions
): LayerHitDisplay {
	if (value === null || value === undefined) return EMPTY;
	if (typeof value === 'object' && Object.keys(value as object).length === 0) return EMPTY;
	const options = toAtlasMessageOptions(opts);

	switch (slug) {
		case 'bezirke':
			return boundaryBezirk(value);
		case 'ortsteile':
			return boundaryOrtsteil(value);
		case 'plz':
			return boundaryPlz(value);
		case 'bodenrichtwerte':
			return brwDisplay(value, opts);
		case 'strassenlaerm-2022':
			return strassenlaermDisplay(value, opts);
		case 'laerm-2023':
			return laermNumericDisplay(value, opts);
		case 'laerm-den':
		case 'laerm-night':
			return laermNumericDisplay(value, opts);
		case 'luft-2023':
		case 'bioklima-2023':
		case 'thermische-belastung-2023':
			return umweltatlasDisplay(value, opts);
		case 'gruenversorgung-2023':
			return umweltatlasDisplay(value, opts, mapGruenversorgungKategorie);
		case 'umweltgerechtigkeit-2023':
			return umweltgerechtigkeitDisplay(value, opts);
		case 'klima-pet-2022':
			return klimaPetDisplay(value, opts);
		case 'klima-kaltlufteinwirkbereich-2022':
			return klimaHighlight(value, m.atlas_value_kaltluft_einwirkbereich(undefined, options));
		case 'klima-leitbahnkorridor-2022':
			return klimaHighlight(value, m.atlas_value_kaltluft_leitbahn_korridor(undefined, options));
		case 'mietspiegel-wohnlage':
		case 'wohnlagen-2024':
			return wohnlageDisplay(value, opts);
		case 'milieuschutz-erhaltungsmiete':
		case 'milieuschutz-staedtebau':
			return poiMilieuschutz(value);
		case 'mss-gesamtindex-2025':
			return mssGesamtindexDisplay(value, opts);
		case 'kitas-2024':
			return poiKita(value);
		case 'schulen-2024':
			return poiSchule(value);
		case 'einschulbereiche-2024':
			return poiEinschulbereich(value);
		case 'krankenhaeuser-plan':
		case 'krankenhaeuser-weitere':
			return poiKrankenhaus(value, opts);
		case 'sportanlagen-2024':
			return poiSportanlage(value, opts);
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
		// Konsolidiert mit den Legenden-Labels (Review-Fund: derselbe Begriff
		// existierte doppelt).
		case 'ubahn-netz':
			return chipOnly(m.atlas_legend_line_ubahn_trasse(undefined, options));
		case 'tram-netz':
			return chipOnly(m.atlas_legend_line_tram_trasse(undefined, options));
		case 'sbahn-netz':
			return chipOnly(m.atlas_legend_line_sbahn_trasse(undefined, options));
		case 'stolpersteine':
			return poiStolperstein(value, opts);
		case 'trinkbrunnen':
			return poiTrinkbrunnen(value, opts);
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
