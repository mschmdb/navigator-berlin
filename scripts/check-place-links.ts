/**
 * Prüft die interne Verlinkung der Kiez-, Bezirks- und Übersichtsseiten gegen einen laufenden
 * Server (DE und EN): jedes Linkziel antwortet mit 200, jeder Anker existiert, kein Kiez und
 * kein Bezirk ist verwaist.
 *
 *   pnpm tsx scripts/check-place-links.ts http://localhost:5173
 */
import { anchorIds, internalLinks, orphans, type InternalLink } from './lib/place-links/links.js';

const base = (process.argv[2] ?? 'http://localhost:5173').replace(/\/$/, '');
const CONCURRENCY = 8;

const pages = new Map<string, { status: number; html: string }>();

async function fetchPage(path: string): Promise<{ status: number; html: string }> {
	const hit = pages.get(path);
	if (hit) return hit;
	const res = await fetch(`${base}${path}`, { redirect: 'manual' });
	const html = res.headers.get('content-type')?.includes('text/html') ? await res.text() : '';
	const out = { status: res.status, html };
	pages.set(path, out);
	return out;
}

async function pool<T>(items: readonly T[], fn: (item: T) => Promise<void>): Promise<void> {
	let i = 0;
	await Promise.all(
		Array.from({ length: CONCURRENCY }, async () => {
			while (i < items.length) await fn(items[i++]);
		})
	);
}

function slugsFrom(links: readonly InternalLink[], prefix: string): string[] {
	return [
		...new Set(
			links.filter((l) => l.path.startsWith(prefix)).map((l) => l.path.slice(prefix.length))
		)
	].filter((s) => s && !s.includes('/'));
}

async function main(): Promise<void> {
	const errors: string[] = [];
	for (const lang of ['', '/en']) {
		const overviews = [`${lang}/kieze`, `${lang}/bezirke`, `${lang}/kiez-score`, lang || '/'];
		for (const o of overviews) await fetchPage(o);
		const kiezSlugs = slugsFrom(
			internalLinks(pages.get(`${lang}/kieze`)?.html ?? '', `${lang}/kieze`),
			`${lang}/kiez/`
		);
		const bezirkSlugs = slugsFrom(
			internalLinks(pages.get(`${lang}/bezirke`)?.html ?? '', `${lang}/bezirke`),
			`${lang}/bezirk/`
		);
		const detailPages = [
			...kiezSlugs.map((s) => `${lang}/kiez/${s}`),
			...bezirkSlugs.map((s) => `${lang}/bezirk/${s}`)
		];
		await pool(detailPages, async (p) => {
			await fetchPage(p);
		});
		const sources = [...overviews, ...detailPages];
		const linkedFrom = new Map<string, Set<string>>();
		const targets = new Map<string, Set<string>>();
		for (const src of sources) {
			const page = pages.get(src);
			if (!page || page.status !== 200) {
				errors.push(`${src}: Status ${page?.status}`);
				continue;
			}
			for (const l of internalLinks(page.html, src)) {
				if (!targets.has(l.path)) targets.set(l.path, new Set());
				if (l.anchor) targets.get(l.path)?.add(`${l.anchor}\u0000${src}`);
				for (const prefix of [`${lang}/kiez/`, `${lang}/bezirk/`]) {
					if (l.path.startsWith(prefix)) {
						const slug = l.path.slice(prefix.length);
						if (!linkedFrom.has(slug)) linkedFrom.set(slug, new Set());
						linkedFrom.get(slug)?.add(src);
					}
				}
			}
		}
		await pool([...targets.keys()], async (t) => {
			const page = await fetchPage(t);
			if (page.status !== 200) {
				errors.push(`Ziel ${t}: Status ${page.status}`);
				return;
			}
			const ids = anchorIds(page.html);
			for (const entry of targets.get(t) ?? []) {
				const [anchor, src] = entry.split('\u0000');
				if (!ids.has(anchor)) errors.push(`${src} → ${t}#${anchor}: Anker fehlt`);
			}
		});
		for (const o of orphans(kiezSlugs, linkedFrom, `${lang}/kieze`, `${lang}/kiez/`)) {
			errors.push(`${lang}/kiez/${o.slug}: ${o.reason}`);
		}
		for (const o of orphans(bezirkSlugs, linkedFrom, `${lang}/bezirke`, `${lang}/bezirk/`)) {
			errors.push(`${lang}/bezirk/${o.slug}: ${o.reason}`);
		}
		if (lang === '/en') {
			for (const src of sources) {
				for (const l of internalLinks(pages.get(src)?.html ?? '', src)) {
					const local = /^\/(kiez|bezirk|kieze|bezirke|kiez-score|methodik|berlin-wahlen)(\/|$)/;
					// Der Sprachumschalter verlinkt bewusst die deutsche Fassung derselben Seite.
					const sameDe = l.path === (src.replace(/^\/en/, '') || '/');
					if (local.test(l.path) && !sameDe) {
						errors.push(`${src} → ${l.path}: EN-Seite verlinkt auf DE`);
					}
				}
			}
		}
		process.stdout.write(
			`${lang || 'de'}: ${kiezSlugs.length} Kieze, ${bezirkSlugs.length} Bezirke, ${targets.size} Linkziele geprüft\n`
		);
	}
	if (errors.length > 0) {
		process.stdout.write(
			`${errors.length} Fehler:\n${[...new Set(errors)].slice(0, 80).join('\n')}\n`
		);
		process.exit(1);
	}
	process.stdout.write('Alle Links in Ordnung.\n');
}

void main();
