import { describe, expect, it } from 'vitest';
import { GET } from './+server';

async function call(districtId: string, year: number): Promise<Response> {
	return await GET({
		url: new URL(
			`http://localhost/api/wahl/geometry?district_id=${encodeURIComponent(districtId)}&year=${year}`
		)
	} as Parameters<typeof GET>[0]);
}

// Läuft gegen die echten static/layers-Dateien (kein DB-Zugriff, keine
// Mocks -- die Route liest direkt vom Dateisystem).
describe('GET /api/wahl/geometry (Review-Fund: Gruppen-Auflösung war ungetestet)', () => {
	it('liefert 400 bei fehlenden Params', async () => {
		const res = await GET({
			url: new URL('http://localhost/api/wahl/geometry')
		} as Parameters<typeof GET>[0]);
		expect(res.status).toBe(400);
	});

	it('liefert geometry_not_available für ein Jahr ohne Stimmbezirks-Geometrie', async () => {
		const res = await call('01W100', 2013);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.error).toBe('geometry_not_available');
	});

	it('district_not_found für eine unbekannte uwbId', async () => {
		const res = await call('99W999', 2021);
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.error).toBe('district_not_found');
		expect(body.hint).toContain('is_gruppe');
	});

	it('01W100 + 2021 löst zur dissolvierten Briefwahl-Gruppen-Fläche auf (is_gruppe: true)', async () => {
		const res = await call('01W100', 2021);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('application/geo+json');
		const body = await res.json();
		expect(body.type).toBe('Feature');
		expect(['Polygon', 'MultiPolygon']).toContain(body.geometry.type);
		expect(body.properties.district_id).toBe('01W100');
		expect(body.properties.year).toBe(2021);
		expect(body.properties.is_gruppe).toBe(true);
	});
});
