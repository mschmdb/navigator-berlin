import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';
import { hitzeReroute, kaelteReroute, storiesReroute } from '$lib/app-mode';

export const reroute: Reroute = (request) => {
	// Hitze-Subdomain: Wurzel rendert die dedizierte /hitze-Route ohne URL-Wechsel (SEO).
	const hitze = hitzeReroute(request.url);
	if (hitze) return hitze;
	// Kälte-Subdomain: gleiches Muster, Wurzel rendert /kaelte.
	const kaelte = kaelteReroute(request.url);
	if (kaelte) return kaelte;
	// Stories-Subdomain: gleiches Muster, Wurzel rendert /stories.
	const stories = storiesReroute(request.url);
	if (stories) return stories;
	return deLocalizeUrl(request.url).pathname;
};
