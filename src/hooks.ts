import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';
import { hitzeReroute } from '$lib/app-mode';

export const reroute: Reroute = (request) => {
	// Hitze-Subdomain: Wurzel rendert die dedizierte /hitze-Route ohne URL-Wechsel (SEO).
	const hitze = hitzeReroute(request.url);
	if (hitze) return hitze;
	return deLocalizeUrl(request.url).pathname;
};
