import { viewportFromUrl } from '$lib/utils/viewport-from-url.js';
import { parseAddress, parseLayers, parseLead } from '$lib/utils/url-state.js';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const viewport = viewportFromUrl(url);
	const address = parseAddress(url.searchParams);
	const activeLayers = parseLayers(url.searchParams.get('layers'));
	const leadSlug = parseLead(url.searchParams.get('lead'), activeLayers);
	const finderOpen = url.searchParams.get('finder') === '1';
	return { ...viewport, address, activeLayers, leadSlug, finderOpen };
};
