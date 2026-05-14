import { describe, expect, it } from 'vitest';
import { GET } from '../../src/routes/api/og/share/+server.js';

interface MockRequestEvent {
	url: URL;
}

async function callGet(query: string): Promise<Response> {
	const url = new URL(`http://localhost/api/og/share${query}`);
	const handler = GET as unknown as (event: MockRequestEvent) => Promise<Response>;
	return handler({ url });
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe('/api/og/share', () => {
	it('rendert PNG mit Cache-Header bei gültigen Params', async () => {
		const res = await callGet(
			'?address=Boxhagener%20Stra%C3%9Fe%2012&lat=52.5135&lng=13.4622&bezirk=Friedrichshain-Kreuzberg&topLayers=Wohnlage%3A%20gut'
		);
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toBe('image/png');
		expect(res.headers.get('Cache-Control')).toContain('max-age=86400');
		const buf = new Uint8Array(await res.arrayBuffer());
		for (let i = 0; i < PNG_MAGIC.length; i++) {
			expect(buf[i]).toBe(PNG_MAGIC[i]);
		}
	}, 30000);

	it('antwortet 400 ohne address-Param', async () => {
		const res = await callGet('?lat=52.5&lng=13.4');
		expect(res.status).toBe(400);
	});

	it('antwortet 400 für Koordinaten außerhalb Berlin', async () => {
		const res = await callGet('?address=Test&lat=48.1&lng=11.5');
		expect(res.status).toBe(400);
		expect(await res.text()).toMatch(/Berlin/);
	});

	it('antwortet 400 ohne lat/lng', async () => {
		const res = await callGet('?address=Test');
		expect(res.status).toBe(400);
	});
});
