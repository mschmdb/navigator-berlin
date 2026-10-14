import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { LayerAggregatesFile } from '$lib/data/layer-aggregates-types.js';

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

const AGGREGATES_PATH = 'static/layer-aggregates/layer-aggregates.json';
let aggregatesCache: Promise<LayerAggregatesFile | null> | null = null;

async function loadAggregates(relativePath: string): Promise<LayerAggregatesFile | null> {
	try {
		const data = (await readStaticJson(relativePath)) as Partial<LayerAggregatesFile> | null;
		if (data?.schemaVersion !== 1) return null;
		if (typeof data.aggregates !== 'object' || data.aggregates === null) return null;
		return data as LayerAggregatesFile;
	} catch {
		return null;
	}
}

/**
 * Layer-Aggregate (Build-Time-JSON, ohne DB), `null` wenn die Datei fehlt oder das Schema nicht passt.
 * Der Standardpfad wird einmal pro Prozess gelesen (Prerender ruft die Funktion pro Seite auf).
 */
export function readLayerAggregatesFile(
	relativePath: string = AGGREGATES_PATH
): Promise<LayerAggregatesFile | null> {
	if (relativePath !== AGGREGATES_PATH) return loadAggregates(relativePath);
	aggregatesCache ??= loadAggregates(relativePath);
	return aggregatesCache;
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
