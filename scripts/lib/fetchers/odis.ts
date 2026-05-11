import { defaultHeaders } from '../user-agent.js';
import { assertAllowed } from '../allowlist.js';
import { withRetry } from '../retry.js';

export async function fetchOdisGeoJson(sourceUrl: string): Promise<string> {
	assertAllowed(sourceUrl);
	return withRetry(async () => {
		const res = await fetch(sourceUrl, { headers: defaultHeaders() });
		if (!res.ok) throw new Error(`ODIS ${sourceUrl} HTTP ${res.status}`);
		return res.text();
	});
}
