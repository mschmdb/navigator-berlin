// Story 1.18 Value-Severity-Mapping. Pro Layer kategorisch oder via numerischer Schwelle.
// Quellen für Schwellen: WHO Environmental-Noise-Guidelines + Umweltatlas-Berlin-Kategorien.
// Story 1.22: Grünversorgung als Versorgungs-Skala invertiert (siehe severityFromGruenversorgung).

import { mapGruenversorgungKategorie } from './gruenversorgung-kategorie.js';

export type SeverityLevel = 'success' | 'success-soft' | 'neutral' | 'warning' | 'danger';

const NUMERIC_THRESHOLD_LAYERS = new Set(['laerm-2023', 'laerm-den', 'laerm-night']);
const UMWELTATLAS_KATEGORIE_LAYERS = new Set([
	'luft-2023',
	'bioklima-2023',
	'thermische-belastung-2023'
]);

function pickKategorie(value: unknown): string | null {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && 'kategorie' in value) {
		const k = (value as Record<string, unknown>).kategorie;
		if (typeof k === 'string') return k;
	}
	return null;
}

function pickWohnlageMode(value: unknown): string | null {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && 'wol_mode' in value) {
		const m = (value as Record<string, unknown>).wol_mode;
		if (typeof m === 'string') return m;
	}
	return null;
}

function severityFromLaermDb(raw: unknown): SeverityLevel {
	if (typeof raw === 'number') {
		if (Number.isNaN(raw)) return 'neutral';
		if (raw < 55) return 'success';
		if (raw <= 65) return 'warning';
		return 'danger';
	}
	if (typeof raw === 'string') {
		const n = Number(raw);
		if (!Number.isNaN(n) && raw.trim() !== '') {
			if (n < 55) return 'success';
			if (n <= 65) return 'warning';
			return 'danger';
		}
		return severityFromUmweltatlasKategorie(raw);
	}
	const kat = pickKategorie(raw);
	if (kat) return severityFromUmweltatlasKategorie(kat);
	return 'neutral';
}

function severityFromUmweltatlasKategorie(kategorie: string): SeverityLevel {
	const v = kategorie.toLowerCase().trim();
	if (v === 'niedrig' || v === 'gering' || v === 'gut' || v === 'sehr niedrig') return 'success';
	if (v === 'mittel' || v === 'mittlere belastung') return 'warning';
	if (v === 'hoch' || v === 'sehr hoch' || v === 'schlecht' || v === 'kritisch') return 'danger';
	return 'neutral';
}

// Story 1.22: Grünversorgung als Versorgungs-Skala — invertiert ggü. Belastungs-Kategorien.
// Roh-Daten (gut/mittel/schlecht) werden auf harmonisierte Skala gemappt; Severity bezieht
// sich auf die harmonisierten Werte (sehr hoch/hoch = gut versorgt = success).
function severityFromGruenversorgung(value: unknown): SeverityLevel {
	const kat = pickKategorie(value);
	if (!kat) return 'neutral';
	const v = mapGruenversorgungKategorie(kat).toLowerCase().trim();
	if (v === 'hoch' || v === 'sehr hoch') return 'success';
	if (v === 'mittel') return 'success-soft';
	if (v === 'gering' || v === 'sehr gering') return 'warning';
	return 'neutral';
}

function severityFromWohnlage(value: unknown): SeverityLevel {
	const mode = pickWohnlageMode(value);
	if (!mode) return 'neutral';
	const v = mode.toLowerCase().trim();
	if (v === 'sehr gut' || v === 'bestlage') return 'success';
	if (v === 'gut') return 'success-soft';
	if (v === 'mittel') return 'success-soft';
	if (v === 'einfach') return 'neutral';
	return 'neutral';
}

function severityFromUmweltgerechtigkeit(value: unknown): SeverityLevel {
	const kat = pickKategorie(value);
	if (!kat) return 'neutral';
	const v = kat.toLowerCase().trim();
	if (v === 'keine' || v === 'keine belastung' || v === 'gering') return 'success';
	if (v === 'einfach' || v === 'einfache belastung') return 'warning';
	if (v === 'zweifach' || v === 'dreifach' || v.includes('mehrfach')) return 'danger';
	return 'neutral';
}

function severityFromKlimaPet(value: unknown): SeverityLevel {
	let pet: number | null = null;
	if (typeof value === 'number') pet = value;
	else if (value && typeof value === 'object' && 'pet14h' in value) {
		const p = (value as Record<string, unknown>).pet14h;
		if (typeof p === 'number') pet = p;
	}
	if (pet === null || Number.isNaN(pet)) return 'neutral';
	if (pet < 30) return 'success';
	if (pet <= 35) return 'warning';
	return 'danger';
}

function hasNonEmptyValue(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	if (typeof value === 'object' && Object.keys(value as object).length === 0) return false;
	return true;
}

export function getValueSeverity(slug: string, value: unknown): SeverityLevel {
	if (value === null || value === undefined) return 'neutral';

	if (NUMERIC_THRESHOLD_LAYERS.has(slug)) return severityFromLaermDb(value);
	if (UMWELTATLAS_KATEGORIE_LAYERS.has(slug)) {
		const kat = pickKategorie(value);
		return kat ? severityFromUmweltatlasKategorie(kat) : 'neutral';
	}

	switch (slug) {
		case 'gruenversorgung-2023':
			return severityFromGruenversorgung(value);

		case 'mietspiegel-wohnlage':
		case 'wohnlagen-2024':
			return severityFromWohnlage(value);

		case 'umweltgerechtigkeit-2023':
			return severityFromUmweltgerechtigkeit(value);

		case 'klima-pet-2022':
			return severityFromKlimaPet(value);

		case 'milieuschutz-erhaltungsmiete':
		case 'milieuschutz-staedtebau':
			return hasNonEmptyValue(value) ? 'success-soft' : 'neutral';

		case 'trinkbrunnen':
			return hasNonEmptyValue(value) ? 'success' : 'neutral';

		// Editorial-Würde (Story 1.12) plus kontext-freie Werte ohne sinnvolle Severity.
		case 'stolpersteine':
		case 'bodenrichtwerte':
		case 'gebaeudealter':
		case 'bezirke':
		case 'ortsteile':
		case 'plz':
			return 'neutral';

		// Story 1.30 MSS: Aggregat ist Faktum, keine Bewertung; KEIN Color-Coding (Stigma-Schutz).
		case 'mss-gesamtindex-2025':
			return 'neutral';

		default:
			return 'neutral';
	}
}
