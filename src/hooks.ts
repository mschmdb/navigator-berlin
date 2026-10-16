import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';
import { hitzeReroute, kaelteReroute } from '$lib/app-mode';

export const reroute: Reroute = (request) => {
	// Hitze-Subdomain: Wurzel rendert die dedizierte /hitze-Route ohne URL-Wechsel (SEO).
	const hitze = hitzeReroute(request.url);
	if (hitze) return hitze;
	// Kälte-Subdomain: gleiches Muster, Wurzel rendert /kaelte.
	const kaelte = kaelteReroute(request.url);
	if (kaelte) return kaelte;
	return deLocalizeUrl(request.url).pathname;
};
