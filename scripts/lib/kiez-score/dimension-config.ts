import type { DimensionConfig } from './types.js';

// Story 10.1: Berliner Versorgungsrichtwert ca. 0.33-0.35 Kita-Plätze pro Kind 0-6
// (Senatsverwaltung). Ab diesem Quotienten scort die Pro-Kopf-Versorgung voll.
export const KITA_BEST_AT = 0.35;

// Story 10.2: Obergrenze Bettenkapazität für die Normalisierung. Größtes Berliner Haus
// (Vivantes Neukölln ~1377 Betten); 1500 als konservative Obergrenze gegen Clamp-Effekte.
export const KRANKENHAUS_MAX_BETTEN = 1500;

// Story 10.6b: Lärm als dB-Mittel (L_DEN) pro LOR statt 3-Stufen-Index. WHO-orientiert:
// <= 45 dB sehr ruhig → 100, >= 75 dB stark belastet → 0 (Matzarakis/WHO-Richtwerte).
export const LAERM_DB_BEST_AT = 45;
export const LAERM_DB_WORST_AT = 75;

export const RUHE_LUFT_CONFIG: DimensionConfig = {
	dimension: 'ruhe-luft',
	layers: [
		{
			layer: 'laerm-db',
			weight: 0.5,
			normalize: {
				kind: 'numeric-inverted',
				field: 'ges_den',
				bestAt: LAERM_DB_BEST_AT,
				worstAt: LAERM_DB_WORST_AT
			}
		},
		{ layer: 'luft-2023', weight: 0.5, normalize: { kind: 'ordinal-3', field: 'kategorie' } }
	]
};

// PET-Hitzebelastung (pet14h, °C): physiologische Äquivalenttemperatur. <= 29 komfortabel → 100,
// >= 41 extreme Hitze → 0 (Matzarakis-Belastungsklassen).
const PET_BEST_AT = 29;
const PET_WORST_AT = 41;

export const GRUEN_HITZE_CONFIG: DimensionConfig = {
	dimension: 'gruen-hitze',
	layers: [
		{
			layer: 'gruenversorgung-2023',
			weight: 0.3,
			normalize: { kind: 'ordinal-4', field: 'kategorie' }
		},
		{ layer: 'gruenanlagen', weight: 0.15, normalize: { kind: 'poi-distance', threshold: 600 } },
		{ layer: 'bioklima-2023', weight: 0.2, normalize: { kind: 'ordinal-3', field: 'kategorie' } },
		{
			layer: 'klima-pet-2022',
			weight: 0.15,
			normalize: { kind: 'numeric-inverted', field: 'pet14h', bestAt: PET_BEST_AT, worstAt: PET_WORST_AT }
		},
		{ layer: 'klima-kaltlufteinwirkbereich-2022', weight: 0.1, normalize: { kind: 'presence' } },
		{ layer: 'klima-leitbahnkorridor-2022', weight: 0.1, normalize: { kind: 'presence' } }
	]
};

export const MOBILITAET_DISTANCE_THRESHOLD_M = 1000;

export const MOBILITAET_CONFIG: DimensionConfig = {
	dimension: 'mobilitaet',
	layers: [
		{
			layer: 'oepnv-ubahn',
			weight: 0.35,
			normalize: { kind: 'mode-distance', mode: 'ubahn', threshold: MOBILITAET_DISTANCE_THRESHOLD_M }
		},
		{
			layer: 'oepnv-sbahn',
			weight: 0.25,
			normalize: { kind: 'mode-distance', mode: 'sbahn', threshold: MOBILITAET_DISTANCE_THRESHOLD_M }
		},
		{
			layer: 'oepnv-tram',
			weight: 0.2,
			normalize: { kind: 'mode-distance', mode: 'tram', threshold: MOBILITAET_DISTANCE_THRESHOLD_M }
		},
		{
			layer: 'oepnv-bus',
			weight: 0.1,
			normalize: { kind: 'mode-distance', mode: 'bus', threshold: MOBILITAET_DISTANCE_THRESHOLD_M }
		},
		{
			layer: 'radverkehr-presence',
			weight: 0.1,
			normalize: {
				kind: 'presence-any-of',
				layers: ['radverkehrsnetz-2025', 'fahrradstrassen-2024']
			}
		}
	]
};

export const VERSORGUNG_CONFIG: DimensionConfig = {
	dimension: 'versorgung',
	layers: [
		// Story 10.1: Kita-Versorgung doppelt — Erreichbarkeit + Plätze pro Kind. Story 10.4: der
		// Erreichbarkeits-Term zählt jetzt Kitas im Radius (Dichte) statt nur die nächste.
		{
			layer: 'kitas-2024',
			// Story 12.2: 0.15 → 0.12 (vorläufig, finale Kalibrierung in 12.3).
			weight: 0.12,
			normalize: { kind: 'poi-density', radiusM: 500, cap: 5, softTailFactor: 0.3 }
		},
		{
			layer: 'kitas-pro-kind',
			// Story 12.2: 0.15 → 0.12 (vorläufig, finale Kalibrierung in 12.3).
			weight: 0.12,
			normalize: { kind: 'kita-pro-kind', field: 'plaetzeProKind', bestAt: KITA_BEST_AT }
		},
		// Story 10.3+10.4: Schul-Term nach Schulart getrennt, jeweils als Dichte im Radius.
		{
			layer: 'schulen-grundschule',
			// Story 12.2: 0.15 → 0.12 (vorläufig, finale Kalibrierung in 12.3).
			weight: 0.12,
			normalize: { kind: 'poi-density', radiusM: 600, cap: 3, softTailFactor: 0.3 }
		},
		{
			layer: 'schulen-weiterfuehrend',
			// Story 12.2: 0.15 → 0.12 (vorläufig, finale Kalibrierung in 12.3).
			weight: 0.12,
			normalize: { kind: 'poi-density', radiusM: 1200, cap: 3, softTailFactor: 0.3 }
		},
		{
			layer: 'krankenhaeuser-plan',
			// Story 12.1: 0.25 → 0.18 (vorläufig, finale Kalibrierung in 12.3), schafft Platz für Nahversorgung.
			weight: 0.18,
			// Story 10.2: Distanz × Bettenkapazität. Bleibt Distanz-basiert (nächstes großes Haus zählt,
			// nicht die Anzahl) — Dichte wäre für Kliniken kein sinnvolles Maß.
			normalize: {
				kind: 'capacity-weighted-distance',
				threshold: 2000,
				bettenField: 'betten_insgesamt',
				maxBetten: KRANKENHAUS_MAX_BETTEN
			}
		},
		// Story 10.4: Spielplatz-Dichte im Radius statt Distanz zum nächsten.
		{
			layer: 'spielplaetze',
			// Story 12.1: 0.15 → 0.10 (vorläufig, finale Kalibrierung in 12.3).
			weight: 0.1,
			normalize: { kind: 'poi-density', radiusM: 400, cap: 8, softTailFactor: 0.4 }
		},
		// Story 12.1: Nahversorgung-Lebensmittel als Alltagsökonomie-Term. Gewicht vorläufig (0.12),
		// finale interne Umverteilung der Versorgungs-Dimension in Story 12.3. Quelle OSM (ODbL).
		{
			layer: 'nahversorgung-lebensmittel',
			weight: 0.12,
			normalize: { kind: 'poi-density', radiusM: 500, cap: 4, softTailFactor: 0.3 }
		},
		// Story 12.2: Apotheke + Post als Nahversorgungs-Terme (seltener als Lebensmittel →
		// größerer Radius, kleinerer Cap). Gewichte vorläufig, finale Kalibrierung in 12.3.
		{
			layer: 'nahversorgung-apotheke',
			weight: 0.07,
			normalize: { kind: 'poi-density', radiusM: 800, cap: 2, softTailFactor: 0.3 }
		},
		{
			layer: 'nahversorgung-post',
			weight: 0.05,
			normalize: { kind: 'poi-density', radiusM: 1000, cap: 2, softTailFactor: 0.3 }
		}
	]
};

// Verdrängungsschutz, positiv-eindeutig: innerhalb eines Milieuschutz-Gebiets = Schutz vorhanden = gut.
export const WOHNSCHUTZ_CONFIG: DimensionConfig = {
	dimension: 'wohnschutz',
	layers: [
		{
			layer: 'wohnschutz-presence',
			weight: 1.0,
			normalize: {
				kind: 'presence-any-of',
				layers: ['milieuschutz-erhaltungsmiete', 'milieuschutz-staedtebau']
			}
		}
	]
};

// Story 13.1: Kultur als eigenständige Dimension (Option C: NICHT im Composite, siehe
// COMPOSITE_DIMENSIONS). Acht OSM-Kultur-Layer als log-gedämpfte poi-density-Terme — die
// Log-Skala bremst den Innenstadt-Center-Bias (erster Kulturort zählt stark, weitere flachen ab).
// Bibliothek/Theater/Museum höher gewichtet als Club/Kunst-im-Raum. Gewichte Owner-Review.
export const KULTUR_CONFIG: DimensionConfig = {
	dimension: 'kultur',
	layers: [
		{
			layer: 'kultur-bibliothek',
			weight: 0.2,
			normalize: { kind: 'poi-density', radiusM: 1000, cap: 2, scale: 'log', softTailFactor: 0.3 }
		},
		{
			layer: 'kultur-theater',
			weight: 0.15,
			normalize: { kind: 'poi-density', radiusM: 1500, cap: 2, scale: 'log', softTailFactor: 0.3 }
		},
		{
			layer: 'kultur-museum',
			weight: 0.15,
			normalize: { kind: 'poi-density', radiusM: 1500, cap: 2, scale: 'log', softTailFactor: 0.3 }
		},
		{
			layer: 'kultur-kino',
			weight: 0.12,
			normalize: { kind: 'poi-density', radiusM: 1500, cap: 2, scale: 'log', softTailFactor: 0.3 }
		},
		{
			layer: 'kultur-galerie',
			weight: 0.1,
			normalize: { kind: 'poi-density', radiusM: 1200, cap: 3, scale: 'log', softTailFactor: 0.3 }
		},
		{
			layer: 'kultur-soziokultur',
			weight: 0.13,
			normalize: { kind: 'poi-density', radiusM: 1200, cap: 2, scale: 'log', softTailFactor: 0.3 }
		},
		{
			layer: 'kultur-kunst-im-raum',
			weight: 0.08,
			normalize: { kind: 'poi-density', radiusM: 800, cap: 5, scale: 'log', softTailFactor: 0.3 }
		},
		{
			layer: 'kultur-club',
			weight: 0.07,
			normalize: { kind: 'poi-density', radiusM: 1200, cap: 3, scale: 'log', softTailFactor: 0.3 }
		}
	]
};

// Story 14.1: Kriminalität als eigenständige Kontext-Dimension (Option C: NICHT im Composite,
// siehe COMPOSITE_DIMENSIONS). Single-Precomputed-Term: liest den BR-Index pro PLR aus Story 14.0
// (static/data/kriminalitaet-lor.json, in build-kiez-scores als perLorHit `kriminalitaet`).
//
// Stigma-Framing wie Soziale Lage (ADR-015/019), NICHT wie Kultur: Strukturell-Indigo statt
// Gut-Grün, der Wert ist Magnitude (höher = mehr erfasste Kriminalität), KEINE Invertierung zu
// "Sicherheit" → `numeric`, nicht `numeric-inverted`.
//
// Normalisierung 0–100 (Owner-bestätigt 2026-06-10): minAt/maxAt aus der BR-Verteilung 2023–2025
// (n=143): min≈315, Median≈951, p95≈1748, max≈3120. maxAt=1750 kappt die City-Core-Ausreißer
// (Touristen/Pendler-Verzerrung: Regierungsviertel≈3120, Tiergarten Süd≈2572, Alexanderplatz≈2123)
// auf 100, damit die Skala nicht vom Einwohner-Nenner-Artefakt dominiert wird.
export const KRIMINALITAET_NORM_MIN_AT = 300;
export const KRIMINALITAET_NORM_MAX_AT = 1750;

export const KRIMINALITAET_CONFIG: DimensionConfig = {
	dimension: 'kriminalitaet',
	layers: [
		{
			layer: 'kriminalitaet',
			weight: 1,
			normalize: {
				kind: 'numeric',
				field: 'index',
				minAt: KRIMINALITAET_NORM_MIN_AT,
				maxAt: KRIMINALITAET_NORM_MAX_AT
			}
		}
	]
};

export const DIMENSION_CONFIGS = [
	RUHE_LUFT_CONFIG,
	GRUEN_HITZE_CONFIG,
	MOBILITAET_CONFIG,
	VERSORGUNG_CONFIG,
	WOHNSCHUTZ_CONFIG,
	KULTUR_CONFIG,
	KRIMINALITAET_CONFIG
] as const;
