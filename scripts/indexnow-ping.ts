/**
 * Story 5.9 AC-10: IndexNow-Push an Bing nach Deploy.
 *
 * Liest die Sitemap-Index + Sub-Sitemaps von navigator.berlin, extrahiert
 * alle URLs, POSTet sie an `https://api.indexnow.org/IndexNow`. Bing
 * verifiziert Ownership via Key-File-Fetch unter `/${INDEXNOW_KEY}.txt`.
 *
 * Yandex-Endpoint bewusst ausgelassen (User-Decision).
 *
 * ENV:
 * - `INDEXNOW_KEY`: 32-hex UUID, gespeichert in Bitwarden.
 * - `INDEXNOW_HOST`: Default `navigator.berlin`. Ueberschreibbar fuer
 *   Coming-Soon-Tests gegen Staging.
 *
 * Usage:
 *   pnpm indexnow:ping           # POST alle Sitemap-URLs
 *   pnpm indexnow:ping --dry     # nur loggen, kein POST
 *   pnpm indexnow:ping --limit=N # nur erste N URLs (Test)
 */

import 'dotenv/config';

const INDEXNOW_API = 'https://api.indexnow.org/IndexNow';
const DEFAULT_HOST = 'navigator.berlin';
const SITEMAP_PATH = '/sitemap.xml';

interface CliArgs {
	readonly dry: boolean;
	readonly limit: number | null;
}

export function parseArgs(argv: readonly string[]): CliArgs {
	let dry = false;
	let limit: number | null = null;
	for (const arg of argv) {
		if (arg === '--dry') dry = true;
		else if (arg.startsWith('--limit=')) {
			const v = Number.parseInt(arg.slice('--limit='.length), 10);
			if (Number.isFinite(v) && v > 0) limit = v;
		}
	}
	return { dry, limit };
}

export function extractLocFromXml(xml: string): string[] {
	const locs: string[] = [];
	const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
	let match: RegExpExecArray | null;
	while ((match = re.exec(xml)) !== null) {
		locs.push(match[1]);
	}
	return locs;
}

export async function fetchSitemapUrls(
	origin: string,
	fetchFn: typeof fetch = fetch
): Promise<string[]> {
	const indexUrl = `${origin}${SITEMAP_PATH}`;
	const indexRes = await fetchFn(indexUrl);
	if (!indexRes.ok) throw new Error(`sitemap-index fetch ${indexRes.status}`);
	const indexXml = await indexRes.text();
	const subLocs = extractLocFromXml(indexXml);

	const looksLikeSubSitemap = subLocs.some((l) => l.includes('sitemap'));
	if (!looksLikeSubSitemap) return subLocs;

	const allUrls = new Set<string>();
	for (const subUrl of subLocs) {
		try {
			const subRes = await fetchFn(subUrl);
			if (!subRes.ok) continue;
			const subXml = await subRes.text();
			for (const url of extractLocFromXml(subXml)) {
				allUrls.add(url);
			}
		} catch {
			/* skip broken sub-sitemap */
		}
	}
	return [...allUrls];
}

export interface IndexNowPayload {
	readonly host: string;
	readonly key: string;
	readonly keyLocation: string;
	readonly urlList: readonly string[];
}

export function buildIndexNowPayload(input: {
	readonly host: string;
	readonly key: string;
	readonly urls: readonly string[];
}): IndexNowPayload {
	return {
		host: input.host,
		key: input.key,
		keyLocation: `https://${input.host}/${input.key}.txt`,
		urlList: input.urls
	};
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const key = process.env.INDEXNOW_KEY;
	const host = process.env.INDEXNOW_HOST ?? DEFAULT_HOST;
	if (!key) {
		process.stderr.write('[indexnow] FATAL: INDEXNOW_KEY not set in .env\n');
		process.exit(1);
	}
	if (!/^[a-f0-9]{8,128}$/i.test(key)) {
		process.stderr.write(`[indexnow] FATAL: INDEXNOW_KEY format invalid (need 8-128 hex)\n`);
		process.exit(1);
	}

	const origin = `https://${host}`;
	process.stdout.write(`[indexnow] origin=${origin}\n`);

	const urls = await fetchSitemapUrls(origin);
	const limited = args.limit !== null ? urls.slice(0, args.limit) : urls;
	process.stdout.write(`[indexnow] collected ${urls.length} urls, posting ${limited.length}\n`);

	if (args.dry) {
		for (const url of limited.slice(0, 10)) process.stdout.write(`  - ${url}\n`);
		if (limited.length > 10) process.stdout.write(`  ... +${limited.length - 10}\n`);
		process.stdout.write('[indexnow] dry-run, no POST\n');
		return;
	}

	const payload = buildIndexNowPayload({ host, key, urls: limited });
	const res = await fetch(INDEXNOW_API, {
		method: 'POST',
		headers: { 'content-type': 'application/json; charset=utf-8' },
		body: JSON.stringify(payload)
	});
	process.stdout.write(`[indexnow] POST ${INDEXNOW_API} -> ${res.status}\n`);
	if (!res.ok && res.status !== 202) {
		const body = await res.text();
		process.stderr.write(`[indexnow] error body: ${body.slice(0, 500)}\n`);
		process.exit(1);
	}
	process.stdout.write('[indexnow] done\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err: unknown) => {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[indexnow] FATAL: ${msg}\n`);
		process.exit(1);
	});
}
