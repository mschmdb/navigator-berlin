import { mapGruenversorgungKategorie } from './gruenversorgung-kategorie.js';
import { m } from '$lib/paraglide/messages.js';
import { formatCount, formatDecimal } from '$lib/i18n/format.js';
import { toAtlasMessageOptions, type LocaleOptions } from '../../internal/atlas-label-options.js';
import { dimensionLabel, kiezScoreScaleLabel, scaleIdFor } from './kiez-score-display.js';

type MessageFn = (
	params?: undefined,
	options?: { locale: import('$lib/paraglide/runtime').Locale }
) => string;

/**
 * Geschlossene Kategorien-Wörter (Koordinator-Entscheidung): Lärm/Luft/
 * Bioklima-`kategorie` und (nach Harmonisierung) Grünversorgung nutzen die
 * gleichen 5 Stufen-Wörter wie `atlas_scale_label_*`; Wohnlage/`wol_mode`
 * nutzt dieselben 3 Wörter wie die Legende (`atlas_legend_word_einfach`/
 * `atlas_scale_label_mittel`/`atlas_legend_word_gut`). Ein unbekannter/
 * offener Rohwert (z. B. ein neuer MSS-Status) bleibt unverändert (Boundary).
 */
const CLOSED_CATEGORY_MESSAGE: Record<string, MessageFn> = {
	'sehr gering': m.atlas_scale_label_sehr_gering,
	gering: m.atlas_scale_label_gering,
	mittel: m.atlas_scale_label_mittel,
	hoch: m.atlas_scale_label_hoch,
	'sehr hoch': m.atlas_scale_label_sehr_hoch,
	einfach: m.atlas_legend_word_einfach,
	gut: m.atlas_legend_word_gut
};

export function translateClosedCategory(raw: string, opts?: LocaleOptions): string {
	const key = raw.toLowerCase().trim();
	const fn = Object.hasOwn(CLOSED_CATEGORY_MESSAGE, key) ? CLOSED_CATEGORY_MESSAGE[key] : undefined;
	return fn ? fn(undefined, toAtlasMessageOptions(opts)) : raw;
}

/**
 * i18n Block B3a: `isMissing` ersetzt den vormaligen Sentinel-String-Vergleich
 * (`formatted.text === 'Daten nicht vorhanden'`) als Logik-Schluessel
 * (Boundary: "isMissing-Flag statt Sentinel"). `text` bleibt für die reine
 * Anzeige lokalisiert.
 */
export interface FormattedValue {
	text: string;
	isNumeric: boolean;
	isMissing: boolean;
}

/**
 * Rohe, aus Quelldaten stammende Werte (Umweltatlas-`kategorie`, MSS-`si_v`/
 * `di_v`, Wohnlage-`wol`/`wol_mode`, `gruppe_txt`, Adressen, Namen, Aemter-
 * /Schulart-Freitext etc.) bleiben LOCALE-UNABHAENGIG unverändert (Boundary
 * Spec i18n B3a: "Datenwerte ... unverändert", analog zu Partei-Kurznamen/
 * `'gültig'` in Block B). Nur die umgebenden UI-Wörter (Präfixe,
 * Verbindungstexte, Skalen-Wörter, Layer-/Dimension-Namen) werden pro
 * Locale aufgelöst -- eine vollständige Uebersetzung jeder offenen
 * Roh-Kategorie über den gesamten Layer-Katalog ist bewusst ausserhalb
 * dieses Fundament-Scopes (siehe Implementation Notes).
 */
function missingValue(opts?: LocaleOptions): FormattedValue {
	const options = toAtlasMessageOptions(opts);
	return { text: m.atlas_value_missing(undefined, options), isNumeric: false, isMissing: true };
}

function value(text: string, isNumeric = false): FormattedValue {
	return { text, isNumeric, isMissing: false };
}

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

function formatBrw(raw: unknown, opts?: LocaleOptions): FormattedValue {
	if (typeof raw === 'number') {
		return value(`${formatCount(raw, toAtlasMessageOptions(opts))} €/m²`, true);
	}
	const brw = pickProp(raw, 'brw');
	const nutzung = pickProp(raw, 'nutzung');
	if (typeof brw !== 'number') return missingValue(opts);
	const suffix = typeof nutzung === 'string' ? ` · ${nutzung}` : '';
	return value(`${formatCount(brw, toAtlasMessageOptions(opts))} €/m²${suffix}`, true);
}

function formatStrassenlaerm(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const gruppe = pickProp(raw, 'gruppe_txt');
	if (typeof gruppe !== 'string') return missingValue(opts);
	const options = toAtlasMessageOptions(opts);
	return value(`${m.atlas_value_schienenverkehr(undefined, options)}: ${gruppe}`);
}

function formatUmweltatlasKategorie(
	raw: unknown,
	prefix: string,
	opts?: LocaleOptions,
	mapKategorie?: (raw: string) => string
): FormattedValue {
	const kategorie = pickProp(raw, 'kategorie');
	const plr = pickProp(raw, 'plr_name');
	if (typeof kategorie !== 'string') return missingValue(opts);
	// Koordinator-Entscheidung: die geschlossene Kategorien-Menge (gering/
	// mittel/hoch, nach Gruenversorgungs-Harmonisierung auch sehr gering/sehr
	// hoch) wird übersetzt; ein echter offener Rohwert bleibt unverändert.
	const harmonized = mapKategorie ? mapKategorie(kategorie) : kategorie;
	const display = translateClosedCategory(harmonized, opts);
	const suffix = typeof plr === 'string' ? ` · ${plr}` : '';
	return value(`${prefix}: ${display}${suffix}`);
}

function formatWohnlage(raw: unknown, opts?: LocaleOptions): FormattedValue {
	// Raw-Adress-Feature aus FIS-Broker (401k Punkte, sources.ts wohnlagen-2024)
	// hat `wol` direkt pro Adresse. Aggregat-Variante mit `wol_mode` /
	// `count_*` kommt aus dem (deferred) PLR-Polygon-Aggregator; wir
	// behandeln beide Pfade damit zukünftige Aggregat-Migration nicht den
	// Inspector bricht.
	const options = toAtlasMessageOptions(opts);
	const aggregateMode = pickProp(raw, 'wol_mode');
	if (typeof aggregateMode === 'string' && aggregateMode !== 'unbekannt') {
		const plr = pickProp(raw, 'plr_name');
		const counts: string[] = [];
		for (const [k, rawLabel] of [
			['count_einfach', 'einfach'],
			['count_mittel', 'mittel'],
			['count_gut', 'gut']
		] as const) {
			const c = pickProp(raw, k);
			if (typeof c === 'number' && c > 0) {
				counts.push(`${c} ${translateClosedCategory(rawLabel, opts)}`);
			}
		}
		const plrPart = typeof plr === 'string' ? ` · ${plr}` : '';
		const breakdown = counts.length > 1 ? ` (${counts.join(', ')})` : '';
		// Ganzer Satz als Message (Review-Fund: kein `${prefix} ${wert}`-
		// Zusammenkleben), `mode` ist bereits übersetzt (geschlossene Menge).
		const mode = translateClosedCategory(aggregateMode, opts);
		return value(`${m.atlas_value_wohnlage_ueberwiegend({ mode }, options)}${plrPart}${breakdown}`);
	}

	const rawWol = pickProp(raw, 'wol');
	if (typeof rawWol === 'string' && rawWol.length > 0) {
		const strasse = pickProp(raw, 'strasse');
		const hnr = pickProp(raw, 'hnr');
		const plr = pickProp(raw, 'plr_name');
		const addr =
			typeof strasse === 'string' && typeof hnr === 'string' ? `${strasse} ${hnr}` : null;
		const tail =
			addr && typeof plr === 'string'
				? ` · ${addr}, ${plr}`
				: addr
					? ` · ${addr}`
					: typeof plr === 'string'
						? ` · ${plr}`
						: '';
		const wolValue = translateClosedCategory(rawWol, opts);
		return value(`${m.atlas_value_wohnlage({ value: wolValue }, options)}${tail}`);
	}

	return missingValue(opts);
}

function formatMilieuschutz(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const name = firstString(raw, 'gebietsname');
	const bezirk = firstString(raw, 'bezirk');
	if (!name) return missingValue(opts);
	const suffix = bezirk ? ` · ${bezirk}` : '';
	return value(`${name}${suffix}`);
}

function formatKita(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const name = firstString(raw, 'e_name');
	const strasse = firstString(raw, 'e_strasse');
	const hnr = firstString(raw, 'e_hnr');
	if (!name) return missingValue(opts);
	const addr = strasse && hnr ? ` · ${strasse} ${hnr}` : '';
	return value(`${name}${addr}`);
}

// OSM-POI (Kultur, Nahversorgung): Name + Adresse statt rohem Tag-Dump.
function formatOsmPoi(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const name = firstString(raw, 'name');
	const strasse = firstString(raw, 'addr:street');
	const hnr = firstString(raw, 'addr:housenumber');
	const addr = strasse ? ` · ${strasse}${hnr ? ' ' + hnr : ''}` : '';
	if (name) return value(`${name}${addr}`);
	const typ = firstString(raw, 'amenity', 'shop', 'tourism');
	if (typ) return value(typ);
	const options = toAtlasMessageOptions(opts);
	return value(m.atlas_value_ohne_namen(undefined, options));
}

function formatSchule(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const name = firstString(raw, 'schulname');
	const art = firstString(raw, 'schulart');
	if (!name) return missingValue(opts);
	const suffix = art ? ` · ${art}` : '';
	return value(`${name}${suffix}`);
}

function formatEinschulbereich(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const esb = firstString(raw, 'esb');
	const bez = firstString(raw, 'bezname');
	if (!esb) return missingValue(opts);
	const suffix = bez ? ` · ${bez}` : '';
	return value(`ESB ${esb}${suffix}`);
}

function formatKrankenhaus(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const name = firstString(raw, 'kkh', 'name');
	const strasse = firstString(raw, 'gc_strasse');
	const betten = pickProp(raw, 'betten');
	if (!name) return missingValue(opts);
	const options = toAtlasMessageOptions(opts);
	const bettenPart =
		typeof betten === 'number'
			? ` · ${formatCount(betten, options)} ${m.atlas_value_betten(undefined, options)}`
			: '';
	const strPart = strasse ? ` · ${strasse}` : '';
	return value(`${name}${strPart}${bettenPart}`);
}

function formatSportanlage(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const name = firstString(raw, 'name');
	const flaeche = pickProp(raw, 'gesamtflaeche_standort_qm');
	if (!name) return missingValue(opts);
	const flPart =
		typeof flaeche === 'number' ? ` · ${formatCount(flaeche, toAtlasMessageOptions(opts))} m²` : '';
	return value(`${name}${flPart}`);
}

function formatGruenflaeche(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const name = firstString(raw, 'namenr', 'kennzeich');
	const objart = firstString(raw, 'objartname');
	const bezirk = firstString(raw, 'bezirkname');
	const label = name ?? objart;
	if (!label) return missingValue(opts);
	const suffix = bezirk ? ` · ${bezirk}` : '';
	return value(`${label}${suffix}`);
}

function formatSchwimmbad(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const name = firstString(raw, 'name_des_schwimmbads');
	const kategorie = firstString(raw, 'badkategorie');
	if (!name) return missingValue(opts);
	const suffix = kategorie ? ` · ${kategorie}` : '';
	return value(`${name}${suffix}`);
}

function formatRadverkehrsnetz(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const netz = firstString(raw, 'ist_radvorrangnetz');
	if (!netz) return missingValue(opts);
	return value(netz);
}

function formatFahrradstrasse(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const strasse = firstString(raw, 'strasse');
	const bezirk = firstString(raw, 'bezirk');
	if (!strasse) return missingValue(opts);
	const suffix = bezirk ? ` · ${bezirk}` : '';
	return value(`${strasse}${suffix}`);
}

function formatOepnvStation(raw: unknown, prefix: string): FormattedValue {
	const name = firstString(raw, 'name');
	if (!name) return value(prefix);
	return value(`${prefix}: ${name}`);
}

function formatKlimaPet(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const pet = pickProp(raw, 'pet14h');
	if (typeof pet !== 'number') return missingValue(opts);
	const options = toAtlasMessageOptions(opts);
	const formatted = formatDecimal(pet, { ...options, maximumFractionDigits: 1 });
	return value(`${formatted} °C (${m.atlas_value_gefuehlt_14uhr(undefined, options)})`, true);
}

function formatEinwohnerdichte(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const dichte = pickProp(raw, 'dichte');
	if (typeof dichte !== 'number' || !Number.isFinite(dichte)) return missingValue(opts);
	const options = toAtlasMessageOptions(opts);
	const formatted = formatDecimal(dichte, { ...options, maximumFractionDigits: 0 });
	return value(`${formatted} ${m.atlas_value_einwohner_pro_km2(undefined, options)}`, true);
}

function formatKlimaHighlight(raw: unknown, label: string, opts?: LocaleOptions): FormattedValue {
	if (!raw || (typeof raw === 'object' && Object.keys(raw).length === 0)) return missingValue(opts);
	return value(label);
}

function formatUmweltgerechtigkeit(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const kategorie = pickProp(raw, 'kategorie');
	if (typeof kategorie !== 'string') return missingValue(opts);
	const options = toAtlasMessageOptions(opts);
	const subs: string[] = [];
	const topicMap = [
		['laerm', m.atlas_value_topic_laerm(undefined, options)],
		['luft', m.atlas_value_topic_luft(undefined, options)],
		['bioklima', m.atlas_value_topic_bioklima(undefined, options)],
		['gruenvers', m.atlas_value_topic_gruen(undefined, options)]
	] as const;
	for (const [key, label] of topicMap) {
		const v = pickProp(raw, key);
		if (typeof v === 'string') subs.push(`${label}: ${v}`);
	}
	const social = pickProp(raw, 'status_ind');
	const suffix = subs.length > 0 ? ` · ${subs.join(', ')}` : '';
	const socialPart =
		typeof social === 'string' ? ` · ${m.atlas_value_soziales(undefined, options)}: ${social}` : '';
	return value(
		`${m.atlas_value_belastung(undefined, options)}: ${kategorie}${suffix}${socialPart}`
	);
}

function formatBezirk(raw: unknown, opts?: LocaleOptions): FormattedValue {
	if (typeof raw === 'string') return value(raw);
	const name = firstString(raw, 'Gemeinde_name');
	if (name) return value(name);
	return missingValue(opts);
}

function formatOrtsteil(raw: unknown, opts?: LocaleOptions): FormattedValue {
	if (typeof raw === 'string') return value(raw);
	const name = firstString(raw, 'OTEIL', 'spatial_alias');
	const bezirk = firstString(raw, 'BEZIRK');
	if (!name) return missingValue(opts);
	const suffix = bezirk && bezirk !== name ? ` · ${bezirk}` : '';
	return value(`${name}${suffix}`);
}

function formatPlz(raw: unknown, opts?: LocaleOptions): FormattedValue {
	if (typeof raw === 'string') return value(raw);
	const plz = firstString(raw, 'plz');
	return plz ? value(plz) : missingValue(opts);
}

function formatLor(
	raw: unknown,
	idKey: string,
	nameKey: string,
	opts?: LocaleOptions
): FormattedValue {
	if (typeof raw === 'string') return value(raw);
	const name = firstString(raw, nameKey);
	const id = firstString(raw, idKey);
	if (!name && !id) return missingValue(opts);
	const text = name && id ? `${name} (${id})` : (name ?? id ?? '');
	return value(text);
}

function formatMssGesamtindex(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const si = firstString(raw, 'si_v');
	const di = firstString(raw, 'di_v');
	const plr = firstString(raw, 'plr_name');
	const kom = firstString(raw, 'kom');
	const options = toAtlasMessageOptions(opts);
	const plrSuffix = plr ? ` · ${plr}` : '';
	if (kom && kom !== 'gültig') {
		return value(
			`${m.atlas_value_aggregat_nicht_aussagekraeftig(undefined, options)}${plrSuffix} (${kom})`
		);
	}
	if (!si || !di) return missingValue(opts);
	return value(
		`${m.atlas_value_status(undefined, options)} ${si}, ${m.atlas_value_dynamik(undefined, options)} ${di}${plrSuffix}`
	);
}

function formatStolperstein(raw: unknown, opts?: LocaleOptions): FormattedValue {
	const options = toAtlasMessageOptions(opts);
	const person = firstString(raw, 'person', 'name', 'vorname_nachname');
	if (person) return value(m.atlas_value_stolperstein_fuer({ name: person }, options));
	return value(m.atlas_value_gedenkstein_in_der_naehe(undefined, options));
}

/** Nutzt dieselbe Schwellen-Quelle wie `scaleFor()` (`scaleIdFor`, Review-
 * Fund: keine dritte Kopie derselben Zahlen). */
function kiezScoreStufeLabel(v: number, opts?: LocaleOptions): string {
	return kiezScoreScaleLabel(scaleIdFor(v), opts);
}

/** Eigene, neutrale 4-Stufen-Wortfamilie für die Kriminalitäts-Dimension
 * (ADR-019, Stigma-Schutz: "niedrig" statt "gering", kein "sehr hoch") --
 * bewusst NICHT `atlas_scale_label_*`, die eine andere Wortfamilie ist
 * ("gering"/"mittel"/"hoch"/"sehr hoch"). Ganze Phrasen als Message (Review-
 * Fund: kein `${stufeWort} ${level}`-Zusammenkleben). */
function kiezScoreNeutralStufeLabel(v: number, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	if (v <= 25) return m.atlas_value_neutral_level_sehr_niedrig(undefined, options);
	if (v <= 50) return m.atlas_value_neutral_level_niedrig(undefined, options);
	if (v <= 75) return m.atlas_value_neutral_level_mittel(undefined, options);
	return m.atlas_value_neutral_level_hoch(undefined, options);
}

function formatKiezScoreValue(
	raw: unknown,
	dimensionLabelText: string,
	variant: { neutral?: boolean } = {},
	opts?: LocaleOptions
): FormattedValue {
	if (!raw || typeof raw !== 'object') return missingValue(opts);
	const obj = raw as Record<string, unknown>;
	const rawValue = obj.value;
	const options = toAtlasMessageOptions(opts);
	if (rawValue === null || rawValue === undefined) {
		return value(`${dimensionLabelText}: ${m.atlas_value_keine_zuordnung(undefined, options)}`);
	}
	const num = typeof rawValue === 'number' ? rawValue : Number(rawValue);
	if (!Number.isFinite(num)) {
		return value(`${dimensionLabelText}: ${m.atlas_value_keine_zuordnung(undefined, options)}`);
	}
	const stufe = variant.neutral
		? kiezScoreNeutralStufeLabel(num, opts)
		: kiezScoreStufeLabel(num, opts);
	return value(`${dimensionLabelText}: ${stufe} (${Math.round(num)}/100)`);
}

export function formatLayerValue(slug: string, raw: unknown, opts?: LocaleOptions): FormattedValue {
	if (raw === null || raw === undefined) return missingValue(opts);
	if (typeof raw === 'object' && raw !== null && Object.keys(raw).length === 0) {
		return missingValue(opts);
	}
	const options = toAtlasMessageOptions(opts);

	switch (slug) {
		case 'bezirke':
			return formatBezirk(raw, opts);
		case 'ortsteile':
			return formatOrtsteil(raw, opts);
		case 'plz':
			return formatPlz(raw, opts);
		case 'lor-prognoseraum':
			return formatLor(raw, 'PGR_ID', 'PGR_NAME', opts);
		case 'lor-bezirksregion':
			return formatLor(raw, 'BZR_ID', 'BZR_NAME', opts);
		case 'lor-planungsraum':
			return formatLor(raw, 'PLR_ID', 'PLR_NAME', opts);
		case 'bodenrichtwerte':
			return formatBrw(raw, opts);
		case 'strassenlaerm-2022':
			return formatStrassenlaerm(raw, opts);
		case 'laerm-2023':
			return formatUmweltatlasKategorie(
				raw,
				m.atlas_value_prefix_laermbelastung(undefined, options),
				opts
			);
		case 'luft-2023':
			return formatUmweltatlasKategorie(
				raw,
				m.atlas_value_prefix_luftbelastung(undefined, options),
				opts
			);
		case 'bioklima-2023':
			return formatUmweltatlasKategorie(
				raw,
				m.atlas_value_prefix_thermische_belastung(undefined, options),
				opts
			);
		case 'gruenversorgung-2023':
			return formatUmweltatlasKategorie(
				raw,
				m.atlas_value_prefix_gruenversorgung(undefined, options),
				opts,
				mapGruenversorgungKategorie
			);
		case 'umweltgerechtigkeit-2023':
			return formatUmweltgerechtigkeit(raw, opts);
		case 'klima-pet-2022':
			return formatKlimaPet(raw, opts);
		case 'einwohner-dichte-2024':
			return formatEinwohnerdichte(raw, opts);
		case 'klima-kaltlufteinwirkbereich-2022':
			return formatKlimaHighlight(
				raw,
				m.atlas_value_kaltluft_einwirkbereich(undefined, options),
				opts
			);
		case 'klima-leitbahnkorridor-2022':
			return formatKlimaHighlight(
				raw,
				m.atlas_value_kaltluft_leitbahn_korridor(undefined, options),
				opts
			);
		case 'wohnlagen-2024':
			return formatWohnlage(raw, opts);
		case 'milieuschutz-erhaltungsmiete':
		case 'milieuschutz-staedtebau':
			return formatMilieuschutz(raw, opts);
		case 'mss-gesamtindex-2025':
			return formatMssGesamtindex(raw, opts);
		case 'kitas-2024':
			return formatKita(raw, opts);
		case 'schulen-2024':
			return formatSchule(raw, opts);
		case 'einschulbereiche-2024':
			return formatEinschulbereich(raw, opts);
		case 'krankenhaeuser-plan':
		case 'krankenhaeuser-weitere':
			return formatKrankenhaus(raw, opts);
		case 'sportanlagen-2024':
			return formatSportanlage(raw, opts);
		case 'gruenanlagen':
		case 'spielplaetze':
			return formatGruenflaeche(raw, opts);
		case 'schwimmbaeder':
			return formatSchwimmbad(raw, opts);
		case 'radverkehrsnetz-2025':
			return formatRadverkehrsnetz(raw, opts);
		case 'fahrradstrassen-2024':
			return formatFahrradstrasse(raw, opts);
		case 'ubahn-stationen':
			return formatOepnvStation(raw, 'U-Bahn');
		case 'sbahn-stationen':
			return formatOepnvStation(raw, 'S-Bahn');
		case 'tram-haltestellen':
			return formatOepnvStation(raw, 'Tram');
		case 'bus-haltestellen':
			return formatOepnvStation(raw, 'Bus');
		// Konsolidiert mit den Legenden-Labels (Review-Fund: derselbe Begriff
		// "U-/S-Bahn-/Tram-Trasse" existierte doppelt).
		case 'ubahn-netz':
			return value(m.atlas_legend_line_ubahn_trasse(undefined, options));
		case 'sbahn-netz':
			return value(m.atlas_legend_line_sbahn_trasse(undefined, options));
		case 'tram-netz':
			return value(m.atlas_legend_line_tram_trasse(undefined, options));
		case 'stolpersteine':
			return formatStolperstein(raw, opts);
		case 'trinkbrunnen':
			return value(m.atlas_value_trinkbrunnen_vor_ort(undefined, options));
		case 'kiez-score-gesamt':
			return formatKiezScoreValue(
				raw,
				m.atlas_value_kiez_score_overall(undefined, options),
				{},
				opts
			);
		case 'kiez-score-ruhe-luft':
			return formatKiezScoreValue(raw, dimensionLabel('ruhe-luft', opts), {}, opts);
		case 'kiez-score-gruen-hitze':
			return formatKiezScoreValue(raw, dimensionLabel('gruen-hitze', opts), {}, opts);
		case 'kiez-score-mobilitaet':
			return formatKiezScoreValue(raw, dimensionLabel('mobilitaet', opts), {}, opts);
		case 'kiez-score-versorgung':
			return formatKiezScoreValue(raw, dimensionLabel('versorgung', opts), {}, opts);
		case 'kiez-score-wohnschutz':
			return formatKiezScoreValue(raw, dimensionLabel('wohnschutz', opts), {}, opts);
		case 'kiez-score-kultur':
			return formatKiezScoreValue(raw, dimensionLabel('kultur', opts), {}, opts);
		case 'kiez-score-kriminalitaet':
			// Magnitude, neutrale Stufen (kein „gut/schlecht", ADR-019).
			return formatKiezScoreValue(
				raw,
				dimensionLabel('kriminalitaet', opts),
				{ neutral: true },
				opts
			);
		// Legacy/fictitious Slugs (Story 1.3 Re-Run TODO):
		case 'mietspiegel-wohnlage':
			return value(safeString(raw));
		case 'laerm-den':
		case 'laerm-night':
			return value(`${safeString(raw)} dB`, true);
		case 'solarpotenzial':
			return value(`${safeString(raw)} kWh/m²`, true);
		case 'gebaeudealter':
			return value(safeString(raw));
		case 'klimaanalyse':
			return value(safeString(raw));
		case 'nahversorgung-lebensmittel':
		case 'nahversorgung-apotheke':
		case 'nahversorgung-post':
		case 'kultur-museum':
		case 'kultur-galerie':
		case 'kultur-kunst-im-raum':
		case 'kultur-theater':
		case 'kultur-bibliothek':
		case 'kultur-kino':
		case 'kultur-soziokultur':
		case 'kultur-club':
			return formatOsmPoi(raw, opts);
		default:
			return value(safeString(raw), typeof raw === 'number');
	}
}
