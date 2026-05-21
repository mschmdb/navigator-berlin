import { describe, it, expect } from 'vitest';
import { GET, prerender } from './+server.js';

describe('webmcp-manifest.json endpoint', () => {
	it('ist prerender=true (siehe AC-5)', () => {
		expect(prerender).toBe(true);
	});

	it('liefert JSON-Response mit 200', async () => {
		const response = await GET({} as Parameters<typeof GET>[0]);
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toContain('application/json');
	});

	it('Response-Body enthält 9 Tools + 3 Prompts', async () => {
		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = JSON.parse(await response.text());
		expect(body.tools).toHaveLength(9);
		expect(body.prompts).toHaveLength(3);
		expect(body.spec_version).toBeDefined();
	});
});
