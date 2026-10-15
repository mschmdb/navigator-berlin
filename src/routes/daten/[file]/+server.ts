import { loadManifest } from '$lib/data/manifest.js';
import type { RequestHandler } from './$types';

/**
 * Stabile Download-Adresse je Layer: `/daten/<slug>.geojson` leitet auf die
 * aktuelle Hash-Datei unter `/layers/` weiter. Dataset-JSON-LD verweist hierauf,
 * weil sich der Hash bei jedem Daten-Update ändert. Nicht unter `/api/`
 * (robots.txt sperrt `/api/`).
 *
 * Bewusst weder in der Sitemap noch in robots.txt gesperrt: `/daten/` liefert
 * Download-Ziele, keine Seiten. Crawler folgen den `contentUrl`-Angaben im JSON-LD.
 */
export const prerender = false;

const FILE_PATTERN = /^([a-z0-9][a-z0-9-]*)\.(geojson|pmtiles)$/;

const notFound = (): Response =>
	new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

export const GET: RequestHandler = async ({ params, fetch }) => {
	const match = FILE_PATTERN.exec(params.file);
	if (!match) return notFound();
	const [, slug, extension] = match;

	let manifest;
	try {
		manifest = await loadManifest(fetch);
	} catch {
		return new Response('Manifest nicht verfügbar', {
			status: 503,
			headers: { 'Cache-Control': 'no-store' }
		});
	}
	const layer = manifest.layers.find((l) => l.slug === slug);
	if (!layer || (layer.format ?? 'geojson') !== extension) return notFound();

	return new Response(null, {
		status: 302,
		headers: {
			Location: `/layers/${layer.filename}`,
			// Revalidieren: nach einem Deploy kann die alte Hash-Datei fehlen.
			'Cache-Control': 'no-cache'
		}
	});
};
