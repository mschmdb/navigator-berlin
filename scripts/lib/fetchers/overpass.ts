import { defaultHeaders } from '../user-agent.js';
import { assertAllowed } from '../allowlist.js';
import { withRetry } from '../retry.js';

export function buildOverpassRequest(endpoint: string, ql: string): { url: string; body: string } {
	assertAllowed(endpoint);
	return {
		url: endpoint,
		body: `data=${encodeURIComponent(ql)}`
	};
}

export async function fetchOverpass(endpoint: string, ql: string): Promise<string> {
	const { url, body } = buildOverpassRequest(endpoint, ql);
	return withRetry(async () => {
		const res = await fetch(url, {
			method: 'POST',
			headers: { ...defaultHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' },
			body
		});
		if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
		return res.text();
	});
}
