import { error, json } from '@sveltejs/kit';
import { loadWahlBundle } from '$lib/skizzen/wahl.server';
import type { RequestHandler } from './$types';

/** Skizze: Wahl-Zeitreihen eines frei gewählten Vergleichsgebiets (Kiez oder Bezirk). */
export const GET: RequestHandler = async ({ url }) => {
	const ebene = url.searchParams.get('ebene');
	const slug = url.searchParams.get('slug');
	if ((ebene !== 'kiez' && ebene !== 'bezirk') || !slug || !/^[a-z0-9-]+$/.test(slug)) {
		throw error(400, 'ebene=kiez|bezirk und slug erforderlich');
	}
	return json(await loadWahlBundle(ebene, slug));
};
