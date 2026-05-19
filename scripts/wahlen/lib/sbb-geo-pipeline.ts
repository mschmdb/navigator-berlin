import type { ShapefilePack } from './sbb-geo-fetcher.js';

interface MapshaperApi {
	applyCommands: (
		cmd: string,
		input: Record<string, Buffer | Uint8Array | string>
	) => Promise<Record<string, Uint8Array>>;
}

/**
 * SBB schreibt teilweise `ANSI 1252` in die .cpg statt iconv-kompatibler Codepage-Namen.
 * Map auf `windows-1252` damit mapshaper's iconv-lite decoder durchläuft.
 */
function normalizeCpg(cpg: Buffer): Buffer {
	const txt = cpg.toString('utf-8').trim().toLowerCase();
	if (txt.startsWith('ansi') && txt.includes('1252')) {
		return Buffer.from('windows-1252', 'utf-8');
	}
	return cpg;
}

/**
 * mapshaper-Pipeline: Shapefile (EPSG:25833) → WGS84-GeoJSON, simplified.
 * Pattern aus scripts/lib/simplify.ts, erweitert um Shapefile-Multi-Input.
 */
export async function shapefileToGeoJSON(pack: ShapefilePack): Promise<string> {
	const mapshaper = (await import('mapshaper')) as unknown as { default?: MapshaperApi } & MapshaperApi;
	const api: MapshaperApi = mapshaper.default ?? (mapshaper as MapshaperApi);

	const inputs: Record<string, Buffer> = {
		'in.shp': pack.shp,
		'in.dbf': pack.dbf,
		'in.prj': pack.prj
	};
	if (pack.cpg) inputs['in.cpg'] = normalizeCpg(pack.cpg);
	if (pack.shx) inputs['in.shx'] = pack.shx;

	const cmd =
		'-i in.shp ' +
		'-proj wgs84 ' +
		'-simplify visvalingam weighted 8% keep-shapes ' +
		'-clean ' +
		'-o format=geojson precision=0.00001 out.json';

	const output = await api.applyCommands(cmd, inputs);
	const file = output['out.json'];
	if (!file) throw new Error('mapshaper: out.json not produced');
	return Buffer.from(file).toString('utf-8');
}
