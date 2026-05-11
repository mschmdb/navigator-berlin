import { defaultHeaders } from '../user-agent.js';
import { assertAllowed } from '../allowlist.js';
import { withRetry } from '../retry.js';

export function buildWfsUrl(baseUrl: string, typeName: string): string {
	const u = new URL(baseUrl);
	u.searchParams.set('SERVICE', 'WFS');
	u.searchParams.set('VERSION', '2.0.0');
	u.searchParams.set('REQUEST', 'GetFeature');
	u.searchParams.set('typeName', typeName);
	u.searchParams.set('srsName', 'EPSG:4326');
	u.searchParams.set('outputFormat', 'application/json');
	return u.toString();
}

export async function fetchFisBrokerWfs(baseUrl: string, typeName: string): Promise<string> {
	const url = buildWfsUrl(baseUrl, typeName);
	assertAllowed(url);
	return withRetry(async () => {
		const res = await fetch(url, { headers: defaultHeaders() });
		if (!res.ok) throw new Error(`FIS-Broker WFS ${typeName} HTTP ${res.status}`);
		return res.text();
	});
}
