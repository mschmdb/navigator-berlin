import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function readStaticJson(relativePath: string): Promise<unknown> {
	const raw = await readFile(resolve(process.cwd(), relativePath), 'utf-8');
	return JSON.parse(raw) as unknown;
}

/** Stichtag der Einwohnerzahlen (ISO), `null` wenn die Datei fehlt oder das Feld nicht passt. */
export async function readEinwohnerStichtag(): Promise<string | null> {
	try {
		const data = (await readStaticJson('static/data/einwohner-lor.json')) as { stichtag?: unknown };
		return typeof data.stichtag === 'string' ? data.stichtag : null;
	} catch {
		return null;
	}
}

/** Composite-Score des Bezirks aus dem statischen JSON (ohne DB), `null` wenn unbekannt. */
export async function readBezirkComposite(bezirkSlug: string): Promise<number | null> {
	try {
		const data = (await readStaticJson('static/kiez-scores/region-composites.json')) as {
			bezirk?: Record<string, unknown>;
		};
		const value = data.bezirk?.[bezirkSlug];
		return typeof value === 'number' ? value : null;
	} catch {
		return null;
	}
}
