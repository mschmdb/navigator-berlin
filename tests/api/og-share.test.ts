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

describe('/api/og/share', () => {
	// Phase-1-Stub: Renderer ist deaktiviert (satori + @resvg/resvg-js blocken
	// adapter-node-Bundling, Re-Enable in Story 4.6/4.7, Memory project_satori_font_pipeline).
	// Endpoint liefert bewusst 503. PNG-/400-Validierungs-Tests kommen mit dem Re-Enable zurück.
	it('liefert 503 (Renderer in Phase 1 deaktiviert)', async () => {
		const res = await callGet('?address=Boxhagener%20Stra%C3%9Fe%2012&lat=52.5135&lng=13.4622');
		expect(res.status).toBe(503);
		expect(res.headers.get('Cache-Control')).toBe('no-store');
	});
});
