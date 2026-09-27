/**
 * Story 2.5b: Sub-Slot-Helper für Klima-Cluster.
 *
 * Quellen:
 * - Stadtklimaanalyse 2015 (PET = Physiologische Äquivalent-Temperatur),
 * - Daten aus der Klima-Normalperiode 1991-2020 (DWD).
 *
 * i18n Block B4a: `opts` mit DE-Default (Boundary: geteilte Helfer ohne
 * `opts.locale` bleiben DE). `describePetKategorie`/`formatPet` rendern auch
 * direkt im Kiez-/Bezirk-Steckbrief (Client, übersetzt); `petErklaerungDe`
 * bleibt ausschließlich ein Server-FAQ-Slot (bleibt deutsch).
 */
import { m } from '$lib/paraglide/messages.js';
import { formatDecimal, type LocaleFormatOptions } from '$lib/i18n/format.js';
import {
	toAtlasMessageOptions,
	type LocaleOptions
} from '../../components/atlas/internal/atlas-label-options.js';

export type PetKategorie =
	| 'thermisch entspannt'
	| 'gemäßigt'
	| 'thermisch belastet'
	| 'stark belastet'
	| 'unbekannt';

/**
 * PET-Bereiche orientieren sich an der gängigen Klassifikation des Deutschen
 * Wetterdienstes (DWD) für PET-Indizes bei Mittagsspitze: <35°C wenig Stress,
 * 35-41°C moderater Hitzestress, 41-46°C starke Belastung, >46°C extreme.
 */
function normalizeKategorie(petCelsius: number | null | undefined): PetKategorie {
	if (petCelsius === null || petCelsius === undefined) return 'unbekannt';
	if (petCelsius < 35) return 'thermisch entspannt';
	if (petCelsius < 41) return 'gemäßigt';
	if (petCelsius < 46) return 'thermisch belastet';
	return 'stark belastet';
}

export function describePetKategorie(
	petCelsius: number | null | undefined,
	opts?: LocaleOptions
): string {
	const options = toAtlasMessageOptions(opts);
	switch (normalizeKategorie(petCelsius)) {
		case 'thermisch entspannt':
			return m.faq_helper_klima_kategorie_entspannt(undefined, options);
		case 'gemäßigt':
			return m.faq_helper_klima_kategorie_gemaessigt(undefined, options);
		case 'thermisch belastet':
			return m.faq_helper_klima_kategorie_belastet(undefined, options);
		case 'stark belastet':
			return m.faq_helper_klima_kategorie_stark_belastet(undefined, options);
		default:
			return m.faq_helper_klima_kategorie_unbekannt(undefined, options);
	}
}

export function petErklaerungDe(
	petCelsius: number | null | undefined,
	opts?: LocaleOptions
): string {
	const options = toAtlasMessageOptions(opts);
	switch (normalizeKategorie(petCelsius)) {
		case 'thermisch entspannt':
			return m.faq_helper_klima_erklaerung_entspannt(undefined, options);
		case 'gemäßigt':
			return m.faq_helper_klima_erklaerung_gemaessigt(undefined, options);
		case 'thermisch belastet':
			return m.faq_helper_klima_erklaerung_belastet(undefined, options);
		case 'stark belastet':
			return m.faq_helper_klima_erklaerung_stark_belastet(undefined, options);
		default:
			return m.faq_helper_klima_erklaerung_unbekannt(undefined, options);
	}
}

/** i18n Block B4a: Zahl über `format.ts::formatDecimal` (ersetzt `toLocaleString('de-DE', ...)`). */
export function formatPet(value: number, opts?: LocaleFormatOptions): string {
	return formatDecimal(value, {
		locale: opts?.locale ?? 'de',
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
}

/**
 * Share-Wert „Anteil sehr-heisser Flächen" (0..1) als Prozent-Text.
 * i18n Block B4a: `opts` mit DE-Default; DE bleibt „Prozent" ausgeschrieben
 * (Byte-identisch zum Alt-Verhalten, bewusst NICHT `format.ts::formatPercent`,
 * das ein `%`-Zeichen statt „Prozent" nutzt).
 */
export function formatShareProzent(value: number, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	const rounded = formatDecimal(value * 100, {
		locale: options.locale,
		maximumFractionDigits: 0
	});
	return m.faq_helper_klima_share_prozent({ value: rounded }, options);
}
