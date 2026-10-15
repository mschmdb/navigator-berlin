/**
 * S6-Messung: Titel- und Beschreibungslängen über alle Sitemap-URLs eines
 * laufenden Servers.
 *
 * Aufruf: `pnpm exec tsx scripts/measure-meta.ts http://localhost:4173`
 *
 * Die `<loc>`-Einträge zeigen auf https://navigator.berlin; das Skript ersetzt
 * den Origin durch die Basis-URL. Die Auswertung (`analyzeMeta`) ist rein und
 * getestet, nur `main` spricht mit dem Netz.
 */

export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 70;
export const DESCRIPTION_MAX = 160;
const SITEMAPS = ['/sitemap-de.xml', '/sitemap-en.xml'] as const;
const CONCURRENCY = 8;

export interface PageMeta {
	readonly url: string;
	readonly title: string;
	readonly description: string;
	/** Gesetzt, wenn die Seite nicht abrufbar war; dann zählt sie nur unter `unreachable`. */
	readonly error?: string;
}

export interface DuplicateGroup {
	readonly locale: 'de' | 'en';
	readonly text: string;
	readonly urls: readonly string[];
}

export interface MetaReport {
	readonly total: number;
	readonly titlesOver60: number;
	readonly titlesOver60Share: number;
	readonly descriptionsUnder70: number;
	readonly descriptionsOver160: number;
	readonly duplicateDescriptions: readonly DuplicateGroup[];
	readonly duplicateTitles: readonly DuplicateGroup[];
	readonly layerDescriptionsUnder70: readonly string[];
	readonly unreachable: readonly string[];
}

export const MAX_LONG_TITLE_SHARE = 0.1;

export interface ThresholdResult {
	readonly ok: boolean;
	readonly violations: readonly string[];
}

const ENTITIES: Readonly<Record<string, string>> = {
	amp: '&',
	quot: '"',
	lt: '<',
	gt: '>',
	apos: "'"
};

function decodeEntities(text: string): string {
	return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
		if (body.startsWith('#x') || body.startsWith('#X')) {
			return String.fromCodePoint(parseInt(body.slice(2), 16));
		}
		if (body.startsWith('#')) return String.fromCodePoint(parseInt(body.slice(1), 10));
		return ENTITIES[body.toLowerCase()] ?? whole;
	});
}

export function extractLocs(xml: string): string[] {
	return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => decodeEntities(match[1].trim()));
}

export function rewriteOrigin(url: string, baseUrl: string): string {
	const target = new URL(url);
	const base = new URL(baseUrl);
	return `${base.origin}${target.pathname}${target.search}`;
}

export function localeOfUrl(url: string): 'de' | 'en' {
	const { pathname } = new URL(url);
	return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'de';
}

export function extractMeta(html: string): { title: string; description: string } {
	const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	let description = '';
	for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
		if (!/\bname=["']description["']/i.test(tag[0])) continue;
		const content = tag[0].match(/\bcontent=("([^"]*)"|'([^']*)')/i);
		description = content ? (content[2] ?? content[3] ?? '') : '';
		break;
	}
	return {
		title: titleMatch ? decodeEntities(titleMatch[1].trim()) : '',
		description: decodeEntities(description.trim())
	};
}

function isLayerUrl(url: string): boolean {
	return /\/layer\/[^/?#]+$/.test(new URL(url).pathname);
}

function findDuplicates(
	pages: readonly PageMeta[],
	pick: (page: PageMeta) => string
): DuplicateGroup[] {
	const groups = new Map<string, { locale: 'de' | 'en'; text: string; urls: string[] }>();
	for (const page of pages) {
		const text = pick(page);
		if (text === '') continue;
		const locale = localeOfUrl(page.url);
		const key = `${locale}\u0000${text}`;
		const group = groups.get(key) ?? { locale, text, urls: [] };
		group.urls.push(page.url);
		groups.set(key, group);
	}
	return [...groups.values()].filter((group) => group.urls.length > 1);
}

export function analyzeMeta(allPages: readonly PageMeta[]): MetaReport {
	const pages = allPages.filter((p) => p.error === undefined);
	const titlesOver60 = pages.filter((p) => p.title.length > TITLE_MAX).length;
	return {
		total: allPages.length,
		titlesOver60,
		titlesOver60Share: pages.length === 0 ? 0 : titlesOver60 / pages.length,
		descriptionsUnder70: pages.filter((p) => p.description.length < DESCRIPTION_MIN).length,
		descriptionsOver160: pages.filter((p) => p.description.length > DESCRIPTION_MAX).length,
		duplicateDescriptions: findDuplicates(pages, (p) => p.description),
		duplicateTitles: findDuplicates(pages, (p) => p.title),
		layerDescriptionsUnder70: pages
			.filter((p) => isLayerUrl(p.url) && p.description.length < DESCRIPTION_MIN)
			.map((p) => p.url),
		unreachable: allPages.filter((p) => p.error !== undefined).map((p) => p.url)
	};
}

/** Abnahmeschwellen von S6; jede Verletzung steht als Zeile in `violations`. */
export function evaluateThresholds(report: MetaReport): ThresholdResult {
	const violations: string[] = [];
	if (report.titlesOver60Share > MAX_LONG_TITLE_SHARE) {
		const share = (report.titlesOver60Share * 100).toFixed(1);
		violations.push(`Titel > 60 Zeichen: ${share} % (erlaubt: höchstens 10 %)`);
	}
	if (report.layerDescriptionsUnder70.length > 0) {
		violations.push(`Layer-Beschreibungen < 70 Zeichen: ${report.layerDescriptionsUnder70.length}`);
	}
	if (report.duplicateDescriptions.length > 0) {
		violations.push(`Doppelte Beschreibungen: ${report.duplicateDescriptions.length}`);
	}
	if (report.unreachable.length > 0) {
		violations.push(`Nicht abrufbar: ${report.unreachable.length}`);
	}
	return { ok: violations.length === 0, violations };
}

async function fetchText(url: string): Promise<string> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${url}`);
	return response.text();
}

async function collectUrls(baseUrl: string): Promise<string[]> {
	const urls = new Set<string>();
	for (const path of SITEMAPS) {
		const xml = await fetchText(new URL(path, baseUrl).href);
		for (const loc of extractLocs(xml)) urls.add(rewriteOrigin(loc, baseUrl));
	}
	return [...urls];
}

async function measureAll(urls: readonly string[]): Promise<PageMeta[]> {
	const results: PageMeta[] = new Array(urls.length);
	let next = 0;
	async function worker(): Promise<void> {
		while (next < urls.length) {
			const index = next++;
			const url = urls[index];
			try {
				results[index] = { url, ...extractMeta(await fetchText(url)) };
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				results[index] = { url, title: '', description: '', error: message };
			}
		}
	}
	await Promise.all(Array.from({ length: CONCURRENCY }, worker));
	return results;
}

function printGroups(label: string, groups: readonly DuplicateGroup[]): void {
	console.log(`${label}: ${groups.length}`);
	for (const group of groups) {
		console.log(`  [${group.locale}] ${group.urls.length}x "${group.text}"`);
		for (const url of group.urls) console.log(`    ${url}`);
	}
}

export function printReport(report: MetaReport): void {
	const share = (report.titlesOver60Share * 100).toFixed(1);
	console.log(`Seiten: ${report.total}`);
	console.log(`Titel > 60 Zeichen: ${report.titlesOver60} (${share} %)`);
	console.log(`Beschreibungen < 70 Zeichen: ${report.descriptionsUnder70}`);
	console.log(`Beschreibungen > 160 Zeichen: ${report.descriptionsOver160}`);
	console.log(`Nicht abrufbar: ${report.unreachable.length}`);
	for (const url of report.unreachable) console.log(`  ${url}`);
	console.log(`Layer-Beschreibungen < 70 Zeichen: ${report.layerDescriptionsUnder70.length}`);
	for (const url of report.layerDescriptionsUnder70) console.log(`  ${url}`);
	printGroups('Doppelte Beschreibungen', report.duplicateDescriptions);
	printGroups('Doppelte Titel', report.duplicateTitles);
}

async function main(): Promise<void> {
	const baseUrl = process.argv[2];
	if (!baseUrl) {
		console.error('Aufruf: tsx scripts/measure-meta.ts <Basis-URL>');
		process.exitCode = 2;
		return;
	}
	const urls = await collectUrls(baseUrl);
	const report = analyzeMeta(await measureAll(urls));
	printReport(report);
	const { ok, violations } = evaluateThresholds(report);
	if (!ok) {
		console.error('Schwellen verletzt:');
		for (const line of violations) console.error(`  ${line}`);
		process.exitCode = 1;
	}
}

const isMain = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href;
if (isMain) {
	main().catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	});
}
