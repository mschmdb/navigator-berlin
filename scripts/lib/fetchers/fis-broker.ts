import { defaultHeaders } from '../user-agent.js';
import { assertAllowed } from '../allowlist.js';
import { withRetry } from '../retry.js';

export function buildWfsUrl(baseUrl: string, typeName: string): string {
	const u = new URL(baseUrl);
	u.searchParams.set('SERVICE', 'WFS');
	u.searchParams.set('VERSION', '2.0.0');
	u.searchParams.set('REQUEST', 'GetFeature');
	u.searchParams.set('typeNames', typeName);
	u.searchParams.set('srsName', 'EPSG:4326');
	u.searchParams.set('outputFormat', 'application/json');
	return u.toString();
}

export async function fetchFisBrokerWfs(
	baseUrl: string,
	typeName: string,
	timeoutMs = 180000
): Promise<string> {
	const url = buildWfsUrl(baseUrl, typeName);
	assertAllowed(url);
	return withRetry(async () => {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const res = await fetch(url, { headers: defaultHeaders(), signal: controller.signal });
			if (!res.ok) throw new Error(`FIS-Broker WFS ${typeName} HTTP ${res.status}`);
			return await res.text();
		} finally {
			clearTimeout(timer);
		}
	});
}
