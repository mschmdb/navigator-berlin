import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import {
	dbUwbIdFromGeo,
	gruppeIdFromGeo,
	type GeoUwbProps
} from '../../../src/lib/data/wahl-geo-mapping.js';

export type { GeoUwbProps };
export { dbUwbIdFromGeo, gruppeIdFromGeo };

export type GruppeMapping = {
	readonly dbUwbId: string;
	readonly gruppeId: string;
	/** 2-stelliger Bezirks-Code der Urne, direkt aus `feature.properties.BEZ`. */
	readonly bezirkCode: string;
};

export type GruppeMappingResult = {
	readonly mappings: GruppeMapping[];
	/**
	 * Urnen-Features, deren `dbUwbId` ODER `gruppeId` sich nicht auflösen
	 * ließ (leeres/fehlendes BWB-Feld, unbekanntes Schema). Der Aufrufer
	 * (`build-wahl-kiez-aggregat.ts`) bricht bei > 0 den Build ab (Boundary
	 * "kein stilles Weglassen").
	 */
	readonly unresolvedFeatureCount: number;
};

/**
 * Baut Urne-uwbId → Briefwahl-Gruppen-ID-Mappings aus der Stimmbezirks-
 * Geometrie (Story 17: Briefwahl-Gruppen als kleinste Kartenebene). Pure,
 * DB-frei -- die DB-seitige Auflösung (Briefwahl-Stimmbezirk-Coverage,
 * Verwaisten-Gate gegen echte `stimmbezirk`-Rows) passiert im aufrufenden
 * Build-Script, das die Wahl-DB kennt.
 *
 * Ein Geo-Feature ohne auflösbare `dbUwbId`/`gruppeId` wird NICHT still
 * übersprungen, sondern über `unresolvedFeatureCount` gemeldet (Preflight-
 * Edge-Cases "leere BWB" / "unbekanntes Schema").
 *
 * Zwei Features mit identischer `dbUwbId` UND identischer `gruppeId`
 * (dieselbe Urne zweimal in der Geometrie, z. B. ein Shapefile-Duplikat)
 * werden dedupliziert. Zwei Features mit identischer `dbUwbId`, aber
 * WIDERSPRÜCHLICHER `gruppeId` (dieselbe Urne scheinbar zwei verschiedenen
 * Gruppen zugeordnet) sind ein Geometrie-Fehler und werfen sofort --
 * Review-Fund: das lief vorher still über den Dedup-Pfad, die zweite
 * (evtl. falsche) Zuordnung wurde kommentarlos verworfen.
 */
export function buildGruppeMappings(
	geoFc: FeatureCollection<Polygon | MultiPolygon, GeoUwbProps>,
	wahlSlug: string
): GruppeMappingResult {
	const mappings: GruppeMapping[] = [];
	let unresolvedFeatureCount = 0;
	const seen = new Map<string, string>();

	for (const feature of geoFc.features) {
		const dbUwbId = dbUwbIdFromGeo(feature.properties, wahlSlug);
		const gruppeId = gruppeIdFromGeo(feature.properties, wahlSlug);
		const bezirkCode =
			typeof feature.properties.BEZ === 'string' ? feature.properties.BEZ.padStart(2, '0') : null;
		if (!dbUwbId || !gruppeId || !bezirkCode) {
			unresolvedFeatureCount++;
			continue;
		}
		const existingGruppeId = seen.get(dbUwbId);
		if (existingGruppeId !== undefined) {
			if (existingGruppeId !== gruppeId) {
				throw new Error(
					`buildGruppeMappings: Urne ${dbUwbId} widersprüchlich zwei Gruppen zugeordnet (${existingGruppeId} vs. ${gruppeId}) -- Build-Abbruch`
				);
			}
			continue;
		}
		seen.set(dbUwbId, gruppeId);
		mappings.push({ dbUwbId, gruppeId, bezirkCode });
	}

	return { mappings, unresolvedFeatureCount };
}
