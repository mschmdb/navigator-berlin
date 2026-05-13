import { viewportFromUrl } from '$lib/utils/viewport-from-url.js';
import { parseAddress, parseLayers } from '$lib/utils/url-state.js';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const viewport = viewportFromUrl(url);
	const address = parseAddress(url.searchParams);
	const activeLayers = parseLayers(url.searchParams.get('layers'));
	return { ...viewport, address, activeLayers };
};
