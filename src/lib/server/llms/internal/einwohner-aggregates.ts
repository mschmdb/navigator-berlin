/**
 * Server-seitiger Loader der slug-gekeyten Einwohner-Aggregate aus
 * `static/data/einwohner-lor.json` (schemaVersion ≥ 2, mit Stichtag).
 *
 * Für llms.txt/llms-full.txt: Der Client-Pfad läuft über fetch, hier lesen
 * wir direkt vom Dateisystem (Build-/Request-Time im Node-Kontext). Fehlt
 * die Datei, liefern wir leere Maps; die Renderer lassen die Zeilen dann weg,
 * statt 0 zu behaupten.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface EinwohnerAggregates {
	readonly kiez: ReadonlyMap<string, number>;
	readonly bezirk: ReadonlyMap<string, number>;
}

interface PayloadShape {
	readonly kiez?: Record<string, { readonly gesamt?: unknown }>;
	readonly bezirk?: Record<string, { readonly gesamt?: unknown }>;
}

function toMap(records: Record<string, { readonly gesamt?: unknown }> | undefined) {
	const map = new Map<string, number>();
	for (const [slug, record] of Object.entries(records ?? {})) {
		if (typeof record?.gesamt === 'number' && record.gesamt > 0) map.set(slug, record.gesamt);
	}
	return map;
}

let cache: { root: string; value: EinwohnerAggregates } | null = null;

export async function loadEinwohnerAggregates(repoRoot: string): Promise<EinwohnerAggregates> {
	if (cache && cache.root === repoRoot) return cache.value;
	let value: EinwohnerAggregates;
	try {
		const raw = await readFile(
			path.join(repoRoot, 'static', 'data', 'einwohner-lor.json'),
			'utf-8'
		);
		const payload = JSON.parse(raw) as PayloadShape;
		value = { kiez: toMap(payload.kiez), bezirk: toMap(payload.bezirk) };
	} catch {
		value = { kiez: new Map(), bezirk: new Map() };
	}
	cache = { root: repoRoot, value };
	return value;
}
