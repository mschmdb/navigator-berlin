import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { weightedMean, type MieteAccumulator } from './weighted-mean.js';

export const ZENSUS_MIETE_SLUG = 'zensus-bestandsmiete-2022';

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

/**
 * Choropleth-Layer: LOR-Planungsraeume mit gewichtetem Mietwert. `miete` ist null unter der
 * Schwelle; Wohnungszahl und Summe bleiben, damit Kiez und Bezirk alle Zellen einrechnen.
 */
export function buildMieteLayer(
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
				miete: acc ? weightedMean(acc) : null,
				wohnungen: acc?.wohnungen ?? 0,
				miete_summe: round2(acc?.mieteSumme ?? 0),
				kiez_slug: kiezSlug,
				bezirk_slug: bezirkSlug
			}
		};
	});
	return { type: 'FeatureCollection', features };
}
