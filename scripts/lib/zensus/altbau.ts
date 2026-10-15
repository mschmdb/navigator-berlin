import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { meanFromSums, type MieteAccumulator } from './weighted-mean.js';

export const ZENSUS_ALTBAU_SLUG = 'zensus-altbau-anteil-2022';

/**
 * Der Akkumulator ist gemeinsam mit der Bestandsmiete genutzt: `wohnungen` = alle Wohnungen,
 * `mieteSumme` = Altbau-Wohnungen x 100. Das Gebietsmittel ist dann der Altbau-Anteil in Prozent.
 */
export function addAltbauCell(acc: MieteAccumulator, wohnungen: number, altbau: number): void {
	if (wohnungen <= 0) return;
	acc.sichereZellen += 1;
	acc.wohnungen += wohnungen;
	acc.mieteSumme += altbau * 100;
}

/** Anteil der Wohnungen in Gebaeuden vor 1949 in Prozent; unter 30 Wohnungen null. */
export function altbauAnteil(acc: MieteAccumulator): number | null {
	return meanFromSums(acc.mieteSumme, acc.wohnungen);
}

/**
 * Choropleth-Layer: LOR-Planungsraeume mit Altbau-Anteil. `altbau_anteil` ist null unter der
 * Schwelle; Wohnungszahl und Summe bleiben, damit Kiez und Bezirk alle Zellen einrechnen.
 */
export function buildAltbauLayer(
	plrFeatures: readonly Feature<Polygon | MultiPolygon>[],
	byPlr: ReadonlyMap<string, MieteAccumulator>,
	kiezSlugByBzr: ReadonlyMap<string, string>,
	bezirkSlugByCode: ReadonlyMap<string, string>
): FeatureCollection {
	const features = plrFeatures.map((f): Feature => {
		const plrId = (f.properties ?? {})['PLR_ID'];
		if (typeof plrId !== 'string') throw new Error('Planungsraum ohne PLR_ID');
		const kiezSlug = kiezSlugByBzr.get(plrId.slice(0, 6));
		const bezirkSlug = bezirkSlugByCode.get(plrId.slice(0, 2));
		if (!kiezSlug || !bezirkSlug) throw new Error(`Kein Kiez-/Bezirk-Slug fuer PLR ${plrId}`);
		const acc = byPlr.get(plrId);
		return {
			type: 'Feature',
			geometry: f.geometry,
			properties: {
				plr_id: plrId,
				altbau_anteil: acc ? altbauAnteil(acc) : null,
				wohnungen: acc?.wohnungen ?? 0,
				altbau_summe: acc?.mieteSumme ?? 0,
				kiez_slug: kiezSlug,
				bezirk_slug: bezirkSlug
			}
		};
	});
	return { type: 'FeatureCollection', features };
}
