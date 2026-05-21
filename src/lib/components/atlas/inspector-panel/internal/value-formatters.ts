import { mapGruenversorgungKategorie } from './gruenversorgung-kategorie.js';

export interface FormattedValue {
	text: string;
	isNumeric: boolean;
}

const FALLBACK: FormattedValue = { text: 'Daten nicht vorhanden', isNumeric: false };

function safeString(value: unknown): string {
	if (value === null || value === undefined) return '';
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value);
		} catch {
			return '';
		}
	}
	return String(value);
}

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

function formatBrw(value: unknown): FormattedValue {
	if (typeof value === 'number') {
		const numFmt = new Intl.NumberFormat('de-DE');
		return { text: `${numFmt.format(value)} €/m²`, isNumeric: true };
	}
	const brw = pickProp(value, 'brw');
	const nutzung = pickProp(value, 'nutzung');
	if (typeof brw !== 'number') return FALLBACK;
	const numFmt = new Intl.NumberFormat('de-DE');
	const suffix = typeof nutzung === 'string' ? ` · ${nutzung}` : '';
	return { text: `${numFmt.format(brw)} €/m²${suffix}`, isNumeric: true };
}

function formatStrassenlaerm(value: unknown): FormattedValue {
	const gruppe = pickProp(value, 'gruppe_txt');
	if (typeof gruppe !== 'string') return FALLBACK;
	return { text: `Schienenverkehr: ${gruppe}`, isNumeric: false };
}

function formatUmweltatlasKategorie(
	value: unknown,
	prefix: string,
	mapKategorie?: (raw: string) => string
): FormattedValue {
	const kategorie = pickProp(value, 'kategorie');
	const plr = pickProp(value, 'plr_name');
	if (typeof kategorie !== 'string') return FALLBACK;
	const display = mapKategorie ? mapKategorie(kategorie) : kategorie;
	const suffix = typeof plr === 'string' ? ` · ${plr}` : '';
	return { text: `${prefix}: ${display}${suffix}`, isNumeric: false };
}

function formatWohnlage(value: unknown): FormattedValue {
	// Raw-Adress-Feature aus FIS-Broker (401k Punkte, sources.ts wohnlagen-2024)
	// hat `wol` direkt pro Adresse. Aggregat-Variante mit `wol_mode` /
	// `count_*` kommt aus dem (deferred) PLR-Polygon-Aggregator; wir
	// behandeln beide Pfade damit zukünftige Aggregat-Migration nicht den
	// Inspector bricht.
	const aggregateMode = pickProp(value, 'wol_mode');
	if (typeof aggregateMode === 'string' && aggregateMode !== 'unbekannt') {
		const plr = pickProp(value, 'plr_name');
		const counts: string[] = [];
		for (const [k, label] of [
			['count_einfach', 'einfach'],
			['count_mittel', 'mittel'],
			['count_gut', 'gut']
		] as const) {
			const c = pickProp(value, k);
			if (typeof c === 'number' && c > 0) counts.push(`${c} ${label}`);
		}
		const plrPart = typeof plr === 'string' ? ` · ${plr}` : '';
		const breakdown = counts.length > 1 ? ` (${counts.join(', ')})` : '';
		return {
			text: `Wohnlage überwiegend ${aggregateMode}${plrPart}${breakdown}`,
			isNumeric: false
		};
	}

	const rawWol = pickProp(value, 'wol');
	if (typeof rawWol === 'string' && rawWol.length > 0) {
		const strasse = pickProp(value, 'strasse');
		const hnr = pickProp(value, 'hnr');
		const plr = pickProp(value, 'plr_name');
		const addr = typeof strasse === 'string' && typeof hnr === 'string' ? `${strasse} ${hnr}` : null;
		const tail =
			addr && typeof plr === 'string'
				? ` · ${addr}, ${plr}`
				: addr
					? ` · ${addr}`
					: typeof plr === 'string'
						? ` · ${plr}`
						: '';
		return { text: `Wohnlage ${rawWol}${tail}`, isNumeric: false };
	}

	return FALLBACK;
}

function formatMilieuschutz(value: unknown): FormattedValue {
	const name = firstString(value, 'gebietsname');
	const bezirk = firstString(value, 'bezirk');
	if (!name) return FALLBACK;
	const suffix = bezirk ? ` · ${bezirk}` : '';
	return { text: `${name}${suffix}`, isNumeric: false };
}

function formatKita(value: unknown): FormattedValue {
	const name = firstString(value, 'e_name');
	const strasse = firstString(value, 'e_strasse');
	const hnr = firstString(value, 'e_hnr');
	if (!name) return FALLBACK;
	const addr = strasse && hnr ? ` · ${strasse} ${hnr}` : '';
	return { text: `${name}${addr}`, isNumeric: false };
}

function formatSchule(value: unknown): FormattedValue {
	const name = firstString(value, 'schulname');
	const art = firstString(value, 'schulart');
	if (!name) return FALLBACK;
	const suffix = art ? ` · ${art}` : '';
	return { text: `${name}${suffix}`, isNumeric: false };
}

function formatEinschulbereich(value: unknown): FormattedValue {
	const esb = firstString(value, 'esb');
	const bez = firstString(value, 'bezname');
	if (!esb) return FALLBACK;
	const suffix = bez ? ` · ${bez}` : '';
	return { text: `ESB ${esb}${suffix}`, isNumeric: false };
}

function formatKrankenhaus(value: unknown): FormattedValue {
	const name = firstString(value, 'kkh', 'name');
	const strasse = firstString(value, 'gc_strasse');
	const betten = pickProp(value, 'betten');
	if (!name) return FALLBACK;
	const bettenPart = typeof betten === 'number' ? ` · ${betten} Betten` : '';
	const strPart = strasse ? ` · ${strasse}` : '';
	return { text: `${name}${strPart}${bettenPart}`, isNumeric: false };
}

function formatSportanlage(value: unknown): FormattedValue {
	const name = firstString(value, 'name');
	const flaeche = pickProp(value, 'gesamtflaeche_standort_qm');
	if (!name) return FALLBACK;
	const flPart =
		typeof flaeche === 'number'
			? ` · ${new Intl.NumberFormat('de-DE').format(flaeche)} m²`
			: '';
	return { text: `${name}${flPart}`, isNumeric: false };
}

function formatGruenflaeche(value: unknown): FormattedValue {
	const name = firstString(value, 'namenr', 'kennzeich');
	const objart = firstString(value, 'objartname');
	const bezirk = firstString(value, 'bezirkname');
	const label = name ?? objart;
	if (!label) return FALLBACK;
	const suffix = bezirk ? ` · ${bezirk}` : '';
	return { text: `${label}${suffix}`, isNumeric: false };
}

function formatSchwimmbad(value: unknown): FormattedValue {
	const name = firstString(value, 'name_des_schwimmbads');
	const kategorie = firstString(value, 'badkategorie');
	if (!name) return FALLBACK;
	const suffix = kategorie ? ` · ${kategorie}` : '';
	return { text: `${name}${suffix}`, isNumeric: false };
}

function formatRadverkehrsnetz(value: unknown): FormattedValue {
	const netz = firstString(value, 'ist_radvorrangnetz');
	if (!netz) return FALLBACK;
	return { text: netz, isNumeric: false };
}

function formatFahrradstrasse(value: unknown): FormattedValue {
	const strasse = firstString(value, 'strasse');
	const bezirk = firstString(value, 'bezirk');
	if (!strasse) return FALLBACK;
	const suffix = bezirk ? ` · ${bezirk}` : '';
	return { text: `${strasse}${suffix}`, isNumeric: false };
}

function formatOepnvStation(value: unknown, prefix: string): FormattedValue {
	const name = firstString(value, 'name');
	if (!name) return { text: prefix, isNumeric: false };
	return { text: `${prefix}: ${name}`, isNumeric: false };
}

function formatKlimaPet(value: unknown): FormattedValue {
	const pet = pickProp(value, 'pet14h');
	if (typeof pet !== 'number') return FALLBACK;
	const numFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
	return { text: `${numFmt.format(pet)} °C (gefühlt, 14 Uhr)`, isNumeric: true };
}

function formatKlimaHighlight(value: unknown, label: string): FormattedValue {
	if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return FALLBACK;
	return { text: label, isNumeric: false };
}

function formatUmweltgerechtigkeit(value: unknown): FormattedValue {
	const kategorie = pickProp(value, 'kategorie');
	if (typeof kategorie !== 'string') return FALLBACK;
	const subs: string[] = [];
	const map = [
		['laerm', 'Lärm'],
		['luft', 'Luft'],
		['bioklima', 'Bioklima'],
		['gruenvers', 'Grün']
	] as const;
	for (const [key, label] of map) {
		const v = pickProp(value, key);
		if (typeof v === 'string') subs.push(`${label}: ${v}`);
	}
	const social = pickProp(value, 'status_ind');
	const suffix = subs.length > 0 ? ` · ${subs.join(', ')}` : '';
	const socialPart = typeof social === 'string' ? ` · Soziales: ${social}` : '';
	return { text: `Belastung: ${kategorie}${suffix}${socialPart}`, isNumeric: false };
}

function formatBezirk(value: unknown): FormattedValue {
	if (typeof value === 'string') return { text: value, isNumeric: false };
	const name = firstString(value, 'Gemeinde_name');
	if (name) return { text: name, isNumeric: false };
	return FALLBACK;
}

function formatOrtsteil(value: unknown): FormattedValue {
	if (typeof value === 'string') return { text: value, isNumeric: false };
	const name = firstString(value, 'OTEIL', 'spatial_alias');
	const bezirk = firstString(value, 'BEZIRK');
	if (!name) return FALLBACK;
	const suffix = bezirk && bezirk !== name ? ` · ${bezirk}` : '';
	return { text: `${name}${suffix}`, isNumeric: false };
}

function formatPlz(value: unknown): FormattedValue {
	if (typeof value === 'string') return { text: value, isNumeric: false };
	const plz = firstString(value, 'plz');
	return plz ? { text: plz, isNumeric: false } : FALLBACK;
}

function formatLor(value: unknown, idKey: string, nameKey: string): FormattedValue {
	if (typeof value === 'string') return { text: value, isNumeric: false };
	const name = firstString(value, nameKey);
	const id = firstString(value, idKey);
	if (!name && !id) return FALLBACK;
	const text = name && id ? `${name} (${id})` : (name ?? id ?? '');
	return { text, isNumeric: false };
}

function formatMssGesamtindex(value: unknown): FormattedValue {
	const si = firstString(value, 'si_v');
	const di = firstString(value, 'di_v');
	const plr = firstString(value, 'plr_name');
	const kom = firstString(value, 'kom');
	const plrSuffix = plr ? ` · ${plr}` : '';
	if (kom && kom !== 'gültig') {
		return {
			text: `Aggregat nicht aussagekräftig${plrSuffix} (${kom})`,
			isNumeric: false
		};
	}
	if (!si || !di) return FALLBACK;
	return { text: `Status ${si}, Dynamik ${di}${plrSuffix}`, isNumeric: false };
}

function formatStolperstein(value: unknown): FormattedValue {
	const person = firstString(value, 'person', 'name', 'vorname_nachname');
	if (person) return { text: `Für ${person}`, isNumeric: false };
	return { text: 'Gedenkstein in der Nähe', isNumeric: false };
}

function kiezScoreStufe(value: number): 'gering' | 'mittel' | 'hoch' | 'sehr hoch' {
	if (value <= 25) return 'gering';
	if (value <= 50) return 'mittel';
	if (value <= 75) return 'hoch';
	return 'sehr hoch';
}

function kiezScoreNeutralStufe(value: number): string {
	if (value <= 25) return 'Stufe sehr niedrig';
	if (value <= 50) return 'Stufe niedrig';
	if (value <= 75) return 'Stufe mittel';
	return 'Stufe hoch';
}

function formatKiezScoreValue(
	value: unknown,
	dimensionLabel: string,
	options: { neutral?: boolean } = {}
): FormattedValue {
	if (!value || typeof value !== 'object') return FALLBACK;
	const obj = value as Record<string, unknown>;
	const raw = obj.value;
	if (raw === null || raw === undefined) {
		return { text: `${dimensionLabel}: keine Zuordnung`, isNumeric: false };
	}
	const num = typeof raw === 'number' ? raw : Number(raw);
	if (!Number.isFinite(num)) {
		return { text: `${dimensionLabel}: keine Zuordnung`, isNumeric: false };
	}
	const stufe = options.neutral ? kiezScoreNeutralStufe(num) : kiezScoreStufe(num);
	return { text: `${dimensionLabel}: ${stufe} (${Math.round(num)}/100)`, isNumeric: false };
}

export function formatLayerValue(slug: string, value: unknown): FormattedValue {
	if (value === null || value === undefined) return FALLBACK;
	if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
		return FALLBACK;
	}

	switch (slug) {
		case 'bezirke':
			return formatBezirk(value);
		case 'ortsteile':
			return formatOrtsteil(value);
		case 'plz':
			return formatPlz(value);
		case 'lor-prognoseraum':
			return formatLor(value, 'PGR_ID', 'PGR_NAME');
		case 'lor-bezirksregion':
			return formatLor(value, 'BZR_ID', 'BZR_NAME');
		case 'lor-planungsraum':
			return formatLor(value, 'PLR_ID', 'PLR_NAME');
		case 'bodenrichtwerte':
			return formatBrw(value);
		case 'strassenlaerm-2022':
			return formatStrassenlaerm(value);
		case 'laerm-2023':
			return formatUmweltatlasKategorie(value, 'Lärmbelastung');
		case 'luft-2023':
			return formatUmweltatlasKategorie(value, 'Luftbelastung');
		case 'bioklima-2023':
			return formatUmweltatlasKategorie(value, 'Thermische Belastung');
		case 'gruenversorgung-2023':
			return formatUmweltatlasKategorie(value, 'Grünversorgung', mapGruenversorgungKategorie);
		case 'umweltgerechtigkeit-2023':
			return formatUmweltgerechtigkeit(value);
		case 'klima-pet-2022':
			return formatKlimaPet(value);
		case 'klima-kaltlufteinwirkbereich-2022':
			return formatKlimaHighlight(value, 'Kaltluft-Einwirkbereich');
		case 'klima-leitbahnkorridor-2022':
			return formatKlimaHighlight(value, 'Kaltluft-Leitbahn-Korridor');
		case 'wohnlagen-2024':
			return formatWohnlage(value);
		case 'milieuschutz-erhaltungsmiete':
		case 'milieuschutz-staedtebau':
			return formatMilieuschutz(value);
		case 'mss-gesamtindex-2025':
			return formatMssGesamtindex(value);
		case 'kitas-2024':
			return formatKita(value);
		case 'schulen-2024':
			return formatSchule(value);
		case 'einschulbereiche-2024':
			return formatEinschulbereich(value);
		case 'krankenhaeuser-plan':
		case 'krankenhaeuser-weitere':
			return formatKrankenhaus(value);
		case 'sportanlagen-2024':
			return formatSportanlage(value);
		case 'gruenanlagen':
		case 'spielplaetze':
			return formatGruenflaeche(value);
		case 'schwimmbaeder':
			return formatSchwimmbad(value);
		case 'radverkehrsnetz-2025':
			return formatRadverkehrsnetz(value);
		case 'fahrradstrassen-2024':
			return formatFahrradstrasse(value);
		case 'ubahn-stationen':
			return formatOepnvStation(value, 'U-Bahn');
		case 'sbahn-stationen':
			return formatOepnvStation(value, 'S-Bahn');
		case 'tram-haltestellen':
			return formatOepnvStation(value, 'Tram');
		case 'bus-haltestellen':
			return formatOepnvStation(value, 'Bus');
		case 'ubahn-netz':
			return { text: 'U-Bahn-Trasse', isNumeric: false };
		case 'tram-netz':
			return { text: 'Tram-Trasse', isNumeric: false };
		case 'stolpersteine':
			return formatStolperstein(value);
		case 'trinkbrunnen':
			return { text: 'Trinkbrunnen vor Ort', isNumeric: false };
		case 'kiez-score-gesamt':
			return formatKiezScoreValue(value, 'Gesamt');
		case 'kiez-score-ruhe-luft':
			return formatKiezScoreValue(value, 'Ruhe & Luft');
		case 'kiez-score-gruen-hitze':
			return formatKiezScoreValue(value, 'Grün & Hitze');
		case 'kiez-score-mobilitaet':
			return formatKiezScoreValue(value, 'Mobilität');
		case 'kiez-score-versorgung':
			return formatKiezScoreValue(value, 'Versorgung');
		case 'kiez-score-wohnschutz':
			return formatKiezScoreValue(value, 'Wohnschutz');
		// Legacy/fictitious Slugs (Story 1.3 Re-Run TODO):
		case 'mietspiegel-wohnlage':
			return { text: safeString(value), isNumeric: false };
		case 'laerm-den':
		case 'laerm-night':
			return { text: `${safeString(value)} dB`, isNumeric: true };
		case 'solarpotenzial':
			return { text: `${safeString(value)} kWh/m²`, isNumeric: true };
		case 'gebaeudealter':
			return { text: safeString(value), isNumeric: false };
		case 'klimaanalyse':
			return { text: safeString(value), isNumeric: false };
		default:
			return { text: safeString(value), isNumeric: typeof value === 'number' };
	}
}
