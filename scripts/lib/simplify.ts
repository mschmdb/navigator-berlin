import type { SimplifyProfile } from './types.js';

export function simplifyCommand(profile: SimplifyProfile): string {
	switch (profile) {
		case 'boundary':
			// keep-shapes verhindert, dass nach Simplifizierung entstandene Slivers
			// durch -clean entfernt werden. Story 1.25: 20%-Profil ohne keep-shapes
			// hat 3826 von 16217 PET-Polygonen verschluckt.
			return '-simplify visvalingam 10% planar keep-shapes -clean';
		case 'polygon':
			return '-simplify visvalingam 20% planar keep-shapes -clean';
		case 'point':
			return '';
		case 'tiles':
			// Tiles-Profile delegiert Simplifizierung an tippecanoe. Hier keine mapshaper-Operation.
			return '';
	}
}

interface MapshaperApi {
	applyCommands: (
		cmd: string,
		input: Record<string, string>
	) => Promise<Record<string, Uint8Array>>;
}

export async function simplifyGeoJSON(geojson: string, profile: SimplifyProfile): Promise<string> {
	if (profile === 'point' || profile === 'tiles') return geojson;
	const mapshaper = (await import('mapshaper')) as unknown as {
		default?: MapshaperApi;
	} & MapshaperApi;
	const api: MapshaperApi = mapshaper.default ?? (mapshaper as MapshaperApi);
	const cmd = `-i input.json ${simplifyCommand(profile)} -o output.json format=geojson`;
	const output = await api.applyCommands(cmd, { 'input.json': geojson });
	const file = output['output.json'];
	if (!file) throw new Error(`mapshaper simplify failed for profile ${profile}`);
	return Buffer.from(file).toString('utf-8');
}
